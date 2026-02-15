#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ESBUILD="$ROOT/node_modules/.bin/esbuild"
BUCKET="${LAMBDA_BUCKET:-lambda-dependencies-store}"

# Build core package first
echo "Building @inboxpilot/core..."
cd "$ROOT/packages/core" && npx tsc

# Lambda name → source path mapping
declare -A LAMBDAS=(
  [inboxpilot-auth-register]="apps/auth/register"
  [inboxpilot-auth-login]="apps/auth/login"
  [inboxpilot-auth-verify]="apps/auth/verify"
  [inboxpilot-api-keys]="apps/keys"
  [inboxpilot-accounts]="apps/accounts"
)

for name in "${!LAMBDAS[@]}"; do
  app="${LAMBDAS[$name]}"
  echo "Bundling $app..."
  $ESBUILD "$ROOT/$app/src/index.ts" \
    --bundle \
    --platform=node \
    --target=node22 \
    --outfile="$ROOT/$app/dist/index.js" \
    --external:@aws-sdk/*
done

# Bundle Gmail Lambdas (include googleapis)
declare -A GMAIL_LAMBDAS=(
  [inboxpilot-connect-gmail]="apps/connect/gmail"
  [inboxpilot-gmail-callback]="apps/auth/gmail/callback"
)

for name in "${!GMAIL_LAMBDAS[@]}"; do
  app="${GMAIL_LAMBDAS[$name]}"
  echo "Bundling $app..."
  $ESBUILD "$ROOT/$app/src/index.ts" \
    --bundle \
    --platform=node \
    --target=node22 \
    --outfile="$ROOT/$app/dist/index.js" \
    --external:@aws-sdk/*
done

# Bundle docs Lambda with embedded swagger spec
echo "Bundling apps/docs..."
DOMAIN="${INBOXPILOT_DOMAIN:-inboxpilot.premprakash.dev}"
SPEC=$(node -e "const yaml=require('yaml');const fs=require('fs');const raw=fs.readFileSync('$ROOT/swagger.yaml','utf8').replace('__DOMAIN__','$DOMAIN');console.log(JSON.stringify(yaml.parse(raw)))")
$ESBUILD "$ROOT/apps/docs/src/index.ts" \
  --bundle \
  --platform=node \
  --target=node22 \
  --outfile="$ROOT/apps/docs/dist/index.js" \
  --define:SPEC="$SPEC"

echo "Build complete."

# Skip S3 upload if requested (used in CI for PR checks)
if [ "$SKIP_UPLOAD" = "1" ]; then
  echo "Skipping S3 upload (SKIP_UPLOAD=1)"
  exit 0
fi

# Zip and upload each Lambda to S3 with readable names
echo ""
echo "Uploading to s3://$BUCKET..."

ALL_LAMBDAS=(
  "inboxpilot-docs:apps/docs"
  "inboxpilot-auth-register:apps/auth/register"
  "inboxpilot-auth-login:apps/auth/login"
  "inboxpilot-auth-verify:apps/auth/verify"
  "inboxpilot-api-keys:apps/keys"
  "inboxpilot-accounts:apps/accounts"
  "inboxpilot-connect-gmail:apps/connect/gmail"
  "inboxpilot-gmail-callback:apps/auth/gmail/callback"
)

for entry in "${ALL_LAMBDAS[@]}"; do
  name="${entry%%:*}"
  app="${entry#*:}"
  cd "$ROOT/$app/dist"
  zip -qj "/tmp/$name.zip" index.js
  aws s3 cp "/tmp/$name.zip" "s3://$BUCKET/$name.zip" --quiet
  echo "  ✓ $name.zip"
  rm "/tmp/$name.zip"
done

echo "Upload complete."
