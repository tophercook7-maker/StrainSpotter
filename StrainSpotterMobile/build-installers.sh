#!/bin/bash

# StrainSpotter Mobile App Builder
# Builds standalone installers for Android and iOS

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║          🌿 STRAINSPOTTER INSTALLER BUILDER 🌿              ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Check if logged in to Expo
echo "Checking Expo authentication..."
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged in to Expo. Please log in:"
    eas login
fi

echo ""
echo "Select platform to build:"
echo "  1) Android APK (direct install)"
echo "  2) Android AAB (Google Play Store)"
echo "  3) iOS IPA (TestFlight/App Store)"
echo "  4) Both Android APK and iOS IPA"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🤖 Building Android APK..."
        eas build --platform android --profile production
        ;;
    2)
        echo ""
        echo "🤖 Building Android AAB (for Play Store)..."
        eas build --platform android --profile production-aab
        ;;
    3)
        echo ""
        echo "🍎 Building iOS IPA..."
        echo ""
        echo "⚠️  NOTE: iOS builds require:"
        echo "   - Apple Developer account ($99/year)"
        echo "   - Valid provisioning profile"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            eas build --platform ios --profile production
        else
            echo "Cancelled."
            exit 0
        fi
        ;;
    4)
        echo ""
        echo "🤖🍎 Building both Android APK and iOS IPA..."
        echo ""
        echo "Building Android APK first..."
        eas build --platform android --profile production
        
        echo ""
        echo "Building iOS IPA..."
        echo ""
        echo "⚠️  NOTE: iOS builds require:"
        echo "   - Apple Developer account ($99/year)"
        echo "   - Valid provisioning profile"
        echo ""
        read -p "Continue with iOS build? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            eas build --platform ios --profile production
        else
            echo "Skipping iOS build."
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ BUILD STARTED                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📱 Your build is now in progress on Expo's servers."
echo ""
echo "To check build status:"
echo "  eas build:list"
echo ""
echo "To download the installer when ready:"
echo "  eas build:download --latest"
echo ""
echo "The installer will be available at:"
echo "  https://expo.dev/accounts/topher1/projects/strainspotter/builds"
echo ""

