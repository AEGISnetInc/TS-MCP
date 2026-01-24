#!/bin/bash
set -e

# Build script that injects PostHog API key and compiles TypeScript
# Usage: npm run build:release
# Reads POSTHOG_API_KEY from environment or .env file

SOURCE_FILE="src/analytics/posthog-client.ts"
DIST_FILE="dist/analytics/posthog-client.js"
PLACEHOLDER="__POSTHOG_API_KEY__"

# Load from .env if not already set
if [ -z "$POSTHOG_API_KEY" ] && [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$POSTHOG_API_KEY" ]; then
  echo "Error: POSTHOG_API_KEY not found"
  echo ""
  echo "Either:"
  echo "  1. Create a .env file with: POSTHOG_API_KEY=your-key"
  echo "  2. Or run: POSTHOG_API_KEY=your-key npm run build:release"
  exit 1
fi

echo "Injecting PostHog key..."
# macOS sed requires -i '' for in-place editing without backup
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/$PLACEHOLDER/$POSTHOG_API_KEY/" "$SOURCE_FILE"
else
  sed -i "s/$PLACEHOLDER/$POSTHOG_API_KEY/" "$SOURCE_FILE"
fi

echo "Building TypeScript..."
npm run build

echo "Restoring source file..."
# Restore placeholder so source stays clean
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/$POSTHOG_API_KEY/$PLACEHOLDER/" "$SOURCE_FILE"
else
  sed -i "s/$POSTHOG_API_KEY/$PLACEHOLDER/" "$SOURCE_FILE"
fi

# Verify injection succeeded
if grep -q "$PLACEHOLDER" "$DIST_FILE"; then
  echo ""
  echo "ERROR: PostHog key was not injected into dist/"
  echo "The placeholder is still present in $DIST_FILE"
  exit 1
fi

echo ""
echo "✓ Release build complete. PostHog key verified in dist/"
echo "Commit dist/ to complete the release."
