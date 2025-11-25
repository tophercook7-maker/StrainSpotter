#!/usr/bin/env bash

# Force refresh iOS assets - aggressive cache clearing

set -euo pipefail

cd "$(dirname "$0")/.."

echo "🧹 Aggressive iOS cache clear..."

# Clean frontend build
echo "▶️  Cleaning frontend..."
rm -rf frontend/dist
rm -rf dist

# Rebuild
echo "▶️  Rebuilding frontend..."
cd frontend
npm run build
cd ..

# Copy to root
cp -R frontend/dist ./dist

# Nuke iOS public folder completely
echo "▶️  Removing ALL iOS public assets..."
rm -rf ios/App/App/public/*

# Copy fresh assets
echo "▶️  Copying fresh assets..."
cp -R dist/* ios/App/App/public/

# Sync Capacitor
echo "▶️  Syncing Capacitor..."
npx cap sync ios

echo ""
echo "✅ FORCE REFRESH COMPLETE!"
echo ""
echo "📱 NOW IN XCODE:"
echo "1. Product → Clean Build Folder (Shift+Cmd+K)"
echo "2. Close Xcode completely (Cmd+Q)"
echo "3. Delete app from device/simulator"
echo "4. Reopen Xcode"
echo "5. Product → Build (Cmd+B)"
echo "6. Product → Run (Cmd+R)"
echo ""
echo "If still no change, run this in terminal:"
echo "  rm -rf ~/Library/Developer/Xcode/DerivedData/*"
echo "  Then repeat Xcode steps above"

