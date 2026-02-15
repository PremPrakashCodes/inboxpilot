#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEBPACK="$ROOT/node_modules/.bin/webpack"
BUCKET="${LAMBDA_BUCKET:-lambda-dependencies-store}"
DIST="$ROOT/apps/api/dist"

# Build core package first
echo "Building @inboxpilot/core..."
cd "$ROOT/packages/core" && npx tsc

# Bundle all Lambdas with webpack + Babel
echo "Bundling Lambdas with webpack..."
cd "$ROOT"
$WEBPACK --config webpack.config.js

echo "Build complete."

# Skip S3 upload if requested (used in CI for PR checks)
if [ "$SKIP_UPLOAD" = "1" ]; then
  echo "Skipping S3 upload (SKIP_UPLOAD=1)"
  exit 0
fi

# Lambda names for upload
LAMBDA_NAMES=(
  inboxpilot-auth-register
  inboxpilot-auth-login
  inboxpilot-auth-verify
  inboxpilot-api-keys
  inboxpilot-accounts
  inboxpilot-connect-gmail
  inboxpilot-gmail-callback
  inboxpilot-docs
)

# Zip and upload each Lambda to S3
echo ""
echo "Uploading to s3://$BUCKET..."

for name in "${LAMBDA_NAMES[@]}"; do
  cd "$DIST/$name"
  zip -qj "/tmp/$name.zip" index.js
  aws s3 cp "/tmp/$name.zip" "s3://$BUCKET/$name.zip" --quiet
  echo "  ✓ $name.zip"
  rm "/tmp/$name.zip"
done

echo "Upload complete."
