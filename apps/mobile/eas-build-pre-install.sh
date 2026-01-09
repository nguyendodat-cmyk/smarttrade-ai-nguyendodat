#!/bin/bash

# EAS Build Pre-Install Hook
# Forces npm install instead of pnpm to avoid symlink issues

set -e

echo "🔧 Running EAS pre-install hook..."

# Navigate to project root
cd "$EAS_BUILD_WORKINGDIR" || cd "$(dirname "$0")/.."

# Remove pnpm-related files to prevent pnpm detection
if [ -f "../../pnpm-workspace.yaml" ]; then
  echo "📦 Removing pnpm-workspace.yaml to force npm..."
  rm -f "../../pnpm-workspace.yaml"
fi

if [ -f "../../pnpm-lock.yaml" ]; then
  echo "📦 Removing pnpm-lock.yaml..."
  rm -f "../../pnpm-lock.yaml"
fi

# Create a package-lock.json if it doesn't exist
if [ ! -f "package-lock.json" ]; then
  echo "📦 Generating package-lock.json with npm..."
  npm i --package-lock-only --legacy-peer-deps || true
fi

echo "✅ Pre-install hook complete"
