#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ESBUILD="$ROOT/node_modules/.bin/esbuild"

# Build core package first
echo "Building @inboxpilot/core..."
cd "$ROOT/packages/core" && npx tsc

# Bundle each Lambda
LAMBDAS=(
  "apps/auth/register"
  "apps/auth/login"
  "apps/auth/verify"
  "apps/keys"
  "apps/accounts"
)

for app in "${LAMBDAS[@]}"; do
  echo "Bundling $app..."
  $ESBUILD "$ROOT/$app/src/index.ts" \
    --bundle \
    --platform=node \
    --target=node22 \
    --outfile="$ROOT/$app/dist/index.js" \
    --external:@aws-sdk/*
done

# Bundle Gmail Lambdas (include googleapis)
for gmail_app in "apps/connect/gmail" "apps/auth/gmail/callback"; do
  echo "Bundling $gmail_app..."
  $ESBUILD "$ROOT/$gmail_app/src/index.ts" \
    --bundle \
    --platform=node \
    --target=node22 \
    --outfile="$ROOT/$gmail_app/dist/index.js" \
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
