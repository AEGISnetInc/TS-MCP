#!/bin/bash
set -e

# Build script that injects PostHog API key and compiles TypeScript
# Usage: POSTHOG_API_KEY=your-key npm run build:release

SOURCE_FILE="src/analytics/posthog-client.ts"
PLACEHOLDER="__POSTHOG_API_KEY__"

if [ -z "$POSTHOG_API_KEY" ]; then
  echo "Error: POSTHOG_API_KEY environment variable not set"
  echo "Usage: POSTHOG_API_KEY=your-key npm run build:release"
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

echo "Done! dist/ now contains the release build with PostHog key."
echo "Commit dist/ to complete the release."
