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
  "apps/connect/gmail"
  "apps/keys"
)

for app in "${LAMBDAS[@]}"; do
  echo "Bundling $app..."
  $ESBUILD "$ROOT/$app/src/index.ts" \
    --bundle \
    --platform=node \
    --target=node22 \
    --outfile="$ROOT/$app/dist/index.js" \
    --external:@aws-sdk/* \
    --external:googleapis
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
