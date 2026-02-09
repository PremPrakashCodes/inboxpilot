#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ESBUILD="$ROOT/node_modules/.bin/esbuild"

# Build core package first
echo "Building @inboxpilot/core..."
cd "$ROOT/packages/core" && npx tsc

# Bundle each Lambda
LAMBDAS=(
  "apps/health"
  "apps/auth/register"
  "apps/auth/login"
  "apps/auth/verify"
  "apps/connect/gmail"
)

for app in "${LAMBDAS[@]}"; do
  echo "Bundling $app..."
  $ESBUILD "$ROOT/$app/src/index.ts" \
    --bundle \
    --platform=node \
    --target=node20 \
    --outfile="$ROOT/$app/dist/index.js" \
    --external:@aws-sdk/* \
    --external:googleapis
done

echo "Build complete."
