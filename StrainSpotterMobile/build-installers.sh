#!/bin/bash

# StrainSpotter Mobile App Installer Builder
# This script helps you build Android APK and iOS IPA installers

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║        🌿 StrainSpotter Mobile Installer Builder 🌿        ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
    echo "✅ EAS CLI installed!"
    echo ""
fi

# Check if logged in to Expo
echo "🔐 Checking Expo authentication..."
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged in to Expo. Please log in:"
    eas login
else
    echo "✅ Logged in as: $(eas whoami)"
fi
echo ""

# Menu
echo "What would you like to build?"
echo ""
echo "1) Android APK (for direct installation)"
echo "2) iOS IPA (requires Apple Developer account)"
echo "3) Both Android and iOS"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🤖 Building Android APK..."
        echo "This will take 10-15 minutes..."
        echo ""
        eas build --platform android --profile production
        echo ""
        echo "✅ Android APK built successfully!"
        echo "📱 Download it from: https://expo.dev/accounts/$(eas whoami)/projects/strainspotter/builds"
        ;;
    2)
        echo ""
        echo "🍎 Building iOS IPA..."
        echo "⚠️  Note: You need an Apple Developer account ($99/year)"
        echo "This will take 15-20 minutes..."
        echo ""
        eas build --platform ios --profile production
        echo ""
        echo "✅ iOS IPA built successfully!"
        echo "📱 Download it from: https://expo.dev/accounts/$(eas whoami)/projects/strainspotter/builds"
        ;;
    3)
        echo ""
        echo "🤖🍎 Building both Android and iOS..."
        echo "This will take 20-30 minutes..."
        echo ""
        eas build --platform all --profile production
        echo ""
        echo "✅ Both installers built successfully!"
        echo "📱 Download them from: https://expo.dev/accounts/$(eas whoami)/projects/strainspotter/builds"
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Download your installer from the Expo dashboard"
echo "2. For Android: Share the APK file with users"
echo "3. For iOS: Distribute via TestFlight or App Store"
echo ""
echo "🌿 Your StrainSpotter app is ready to install! ✨"
echo ""

