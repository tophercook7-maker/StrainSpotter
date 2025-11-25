#!/usr/bin/env bash

#
# StrainSpotter: Clean rebuild script to clear all caches and rebuild
# Use this when changes aren't appearing in the app

set -euo pipefail

cd "$(dirname "$0")/.."

echo "🧹 Cleaning all caches and rebuilding..."

echo "▶️  Cleaning frontend build cache..."
rm -rf frontend/node_modules/.vite
rm -rf frontend/dist
rm -rf dist

echo "▶️  Rebuilding frontend..."
cd frontend
npm ci
npm run build
cd ..

echo "▶️  Copying dist to root..."
rm -rf dist
cp -R frontend/dist ./dist

echo "▶️  Cleaning iOS public folder..."
rm -rf ios/App/App/public/*
rm -rf ios/App/App/public/assets

echo "▶️  Syncing Capacitor iOS..."
npx cap sync ios

echo "✅ Clean rebuild complete!"
echo ""
echo "📱 NEXT STEPS IN XCODE:"
echo "1. Product → Clean Build Folder (Shift+Cmd+K)"
echo "2. Product → Build (Cmd+B)"
echo "3. Delete the app from your device/simulator"
echo "4. Product → Run (Cmd+R) to reinstall fresh"
echo ""
echo "This ensures all caches are cleared and the app loads fresh assets."

