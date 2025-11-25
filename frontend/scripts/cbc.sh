#!/usr/bin/env bash

#
# StrainSpotter: Build web, sync iOS (Capacitor), open Xcode

set -euo pipefail

# Always run from project root (scripts/ is one level down)
cd "$(dirname "$0")/.."

echo "▶️  StrainSpotter: build + iOS sync starting..."

echo "▶️  Ensuring Capacitor CLI is available (via npx)..."
# This uses the local devDependency if present; otherwise npx will download a temp copy.
npx cap --version >/dev/null 2>&1 || true

echo "▶️  Building frontend (npm ci + npm run build)..."
cd frontend
npm ci
npm run build
cd ..

echo "▶️  Copying dist/ to project root..."
rm -rf dist
cp -R frontend/dist ./dist

echo "▶️  Syncing Capacitor iOS (npx cap sync ios)..."
npx cap sync ios

echo "▶️  Opening Xcode (npx cap open ios)..."
npx cap open ios

echo "✅  StrainSpotter build + iOS sync done."
