#!/usr/bin/env bash

set -euo pipefail

# Resolve repo root (works no matter where you run it from)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "▶️  StrainSpotter: build + iOS sync starting..."

echo "▶️  Ensuring Capacitor CLI is installed at ROOT (devDependency)..."
# We keep this cheap: only installs if cap is missing
if ! npx --yes cap --version >/dev/null 2>&1; then
  echo "⚙️  Installing @capacitor/cli at project root..."
  npm install -D @capacitor/cli
fi

echo "▶️  Building frontend (npm ci + npm run build)..."
cd "$ROOT_DIR/frontend"
npm ci
npm run build

echo "▶️  Copying dist/ to project root..."
cd "$ROOT_DIR"
rm -rf dist
cp -R frontend/dist ./dist

echo "▶️  Syncing Capacitor iOS (npx cap sync ios)..."
npx --yes cap sync ios

echo "▶️  Opening Xcode (npx cap open ios)..."
npx --yes cap open ios

echo "✅  StrainSpotter build + iOS sync done."

