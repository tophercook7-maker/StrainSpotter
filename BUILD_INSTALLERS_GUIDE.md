# 📱 StrainSpotter - Build Installers Guide

## 🎯 Overview

This guide shows you how to build standalone mobile app installers for **Android** and **iOS** using Expo EAS Build and GitHub Releases.

---

## 🚀 Quick Start - Build Now

### Option 1: Manual Build (Recommended for First Time)

```bash
cd StrainSpotterMobile
./build-installers.sh
```

This interactive script will:
1. Check if you're logged into Expo
2. Let you choose which platform to build
3. Start the build on Expo's servers
4. Give you a link to download the installer

### Option 2: GitHub Actions (Automated)

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **Build Mobile Apps** workflow
4. Click **Run workflow**
5. Select platform (Android, iOS, or both)
6. Click **Run workflow**

The installers will be uploaded as artifacts you can download.

---

## 📦 What Gets Built

### Android
- **APK File** - Direct install on any Android device
  - File: `StrainSpotter.apk`
  - Size: ~50-80 MB
  - Install: Enable "Unknown Sources" in Android settings, then tap to install

- **AAB File** - For Google Play Store submission
  - File: `StrainSpotter.aab`
  - Required for Play Store
  - Cannot be installed directly

### iOS
- **IPA File** - For TestFlight or App Store
  - File: `StrainSpotter.ipa`
  - Size: ~60-100 MB
  - Requires: Apple Developer account ($99/year)
  - Install via: TestFlight or Xcode

---

## 🛠️ Setup Requirements

### For Android Builds
✅ **No special requirements!**
- Expo handles everything
- Builds work out of the box

### For iOS Builds
⚠️ **Requires Apple Developer Account**
- Cost: $99/year
- Sign up: https://developer.apple.com
- You'll need to configure:
  - App ID
  - Provisioning Profile
  - Distribution Certificate

**First iOS build?** Run this:
```bash
cd StrainSpotterMobile
eas build:configure
```

---

## 📋 Build Profiles

Your app has 3 build profiles configured in `eas.json`:

### 1. **Production** (Default)
- For App Store / Play Store submission
- Optimized and minified
- Android: Builds APK
- iOS: Builds IPA

```bash
eas build --platform android --profile production
```

### 2. **Production-AAB**
- For Google Play Store only
- Builds Android App Bundle (AAB)

```bash
eas build --platform android --profile production-aab
```

### 3. **Preview**
- For internal testing
- Faster builds
- Android: APK for direct install

```bash
eas build --platform android --profile preview
```

---

## 🎨 App Configuration

Your app is configured in `StrainSpotterMobile/app.json`:

```json
{
  "name": "StrainSpotter",
  "version": "1.0.0",
  "ios": {
    "bundleIdentifier": "com.strainspotter.app"
  },
  "android": {
    "package": "com.strainspotter.app"
  }
}
```

### App Icons
- **Icon**: `assets/icon.png` (1024x1024)
- **Adaptive Icon**: `assets/adaptive-icon.png` (Android)
- **Splash Screen**: `assets/splash-icon.png`

---

## 🔧 Manual Build Commands

### Build Android APK
```bash
cd StrainSpotterMobile
eas build --platform android --profile production
```

### Build Android AAB (Play Store)
```bash
cd StrainSpotterMobile
eas build --platform android --profile production-aab
```

### Build iOS IPA
```bash
cd StrainSpotterMobile
eas build --platform ios --profile production
```

### Build Both Platforms
```bash
cd StrainSpotterMobile
eas build --platform all --profile production
```

---

## 📥 Download Built Apps

### Check Build Status
```bash
eas build:list
```

### Download Latest Build
```bash
eas build:download --latest
```

### Download Specific Build
```bash
eas build:download --id <BUILD_ID>
```

### View in Browser
```
https://expo.dev/accounts/topher1/projects/strainspotter/builds
```

---

## 🎁 GitHub Releases (Automated Distribution)

### Create a Release with Installers

1. **Tag your code:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. **GitHub Actions will automatically:**
   - Build Android APK
   - Build iOS IPA
   - Create a GitHub Release
   - Upload installers as downloadable assets

3. **Users can download from:**
```
https://github.com/tophercook7-maker/StrainSpotter/releases
```

---

## 📱 Installing on Devices

### Android Installation

1. **Download APK** to your Android device
2. **Enable Unknown Sources:**
   - Settings → Security → Unknown Sources → Enable
   - Or: Settings → Apps → Special Access → Install Unknown Apps
3. **Tap the APK file** to install
4. **Open StrainSpotter** from your app drawer

### iOS Installation (TestFlight)

1. **Upload IPA to App Store Connect**
2. **Add to TestFlight**
3. **Invite testers via email**
4. **Testers install TestFlight app**
5. **Testers install StrainSpotter from TestFlight**

### iOS Installation (Direct - Advanced)

Requires:
- Apple Developer account
- Device UDID registered
- Ad-hoc provisioning profile

```bash
# Install via Xcode
open StrainSpotter.ipa
```

---

## 🔐 Environment Variables for Builds

Your app needs these environment variables (already configured in `app.json`):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://rdqpxixsbqcsyfewcmbz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-key>
EXPO_PUBLIC_API_BASE=https://strainspotter.onrender.com
```

These are embedded at build time from your local `.env` file.

---

## 🐛 Troubleshooting

### Build Failed
```bash
# View build logs
eas build:view <BUILD_ID>

# Common fixes:
# 1. Update dependencies
npm install

# 2. Clear cache
eas build --clear-cache

# 3. Check credentials
eas credentials
```

### iOS Build Requires Credentials
```bash
# Configure iOS credentials
eas credentials

# Or let EAS manage them automatically
eas build --platform ios --auto-submit
```

### Android Build Issues
```bash
# Check Android configuration
eas build:configure

# Validate app.json
npx expo-doctor
```

---

## 📊 Build Times

Typical build times on Expo's servers:

- **Android APK**: 5-10 minutes
- **Android AAB**: 5-10 minutes  
- **iOS IPA**: 10-20 minutes

---

## 💰 Costs

### Expo EAS Build
- **Free Tier**: Limited builds per month
- **Paid Plans**: Unlimited builds
- See: https://expo.dev/pricing

### App Store Distribution
- **Apple Developer**: $99/year (required for iOS)
- **Google Play**: $25 one-time fee (required for Play Store)

### Direct Distribution
- **Android APK**: FREE (no Play Store needed)
- **iOS IPA**: Requires Apple Developer account

---

## 🎯 Next Steps

1. ✅ **Build Android APK** - Test on your phone
2. ✅ **Build iOS IPA** - Test with TestFlight
3. ✅ **Create GitHub Release** - Share with users
4. 📱 **Submit to App Stores** - Reach more users

---

## 📚 Resources

- **Expo EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **App Store Submission**: https://docs.expo.dev/submit/ios/
- **Play Store Submission**: https://docs.expo.dev/submit/android/
- **Your Expo Dashboard**: https://expo.dev/accounts/topher1/projects/strainspotter

---

## 🆘 Need Help?

Run the interactive build script:
```bash
cd StrainSpotterMobile
./build-installers.sh
```

It will guide you through the process step-by-step! 🌿

