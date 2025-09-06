#!/bin/zsh
set -e

# rebuild web bundle
pnpm run build || pnpm exec vite build

# sync to iOS
npx cap sync ios

# build iOS app for simulator
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 16 Pro Max" build

# find built .app
APP_DIR="$(find "$HOME/Library/Developer/Xcode/DerivedData" -type d -path '*/Build/Products/Debug-iphonesimulator/App.app' -print | sort -r | head -n1)"
[ -d "$APP_DIR" ] || { echo "Simulator .app not found"; exit 1; }

# get bundle id
BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP_DIR/Info.plist")"

# boot simulator
open -a Simulator
UDID="$(xcrun simctl list devices | awk -F '[()]' '/iPhone 16 Pro Max/ && /(Booted|Shutdown)/{print $2; exit}')"
xcrun simctl boot "$UDID" 2>/dev/null || true

# clear app data before reinstall (fresh start every time)
APP_DATA="$(xcrun simctl get_app_container "$UDID" "$BUNDLE_ID" data 2>/dev/null || true)"
if [ -n "$APP_DATA" ]; then
  echo "Wiping old app data at $APP_DATA"
  rm -rf "$APP_DATA/Library/WebKit/WebsiteData" "$APP_DATA/Library/Preferences" "$APP_DATA/Documents" "$APP_DATA/tmp" || true
fi

# uninstall, install, and launch
xcrun simctl uninstall "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
xcrun simctl install "$UDID" "$APP_DIR"
xcrun simctl launch "$UDID" "$BUNDLE_ID"
