#!/bin/bash

# Daniyal To-Do APK Builder Script

echo "🚀 Daniyal To-Do - Building Android APK"
echo "========================================"
echo ""

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ] && [ ! -f "android/local.properties" ]; then
    echo "❌ Android SDK not found!"
    echo ""
    echo "Please do ONE of the following:"
    echo ""
    echo "Option 1: Install Android Studio (Recommended)"
    echo "  1. Install Android Studio"
    echo "  2. Open android/ folder in Android Studio"
    echo "  3. Build → Build APK(s)"
    echo ""
    echo "Option 2: Set Android SDK Location"
    echo "  export ANDROID_HOME=/path/to/android/sdk"
    echo "  OR create android/local.properties with:"
    echo "  sdk.dir=/path/to/android/sdk"
    echo ""
    exit 1
fi

echo "✅ Android SDK found!"
echo ""

# Build web app
echo "📦 Step 1: Building web app..."
npm run build:web

if [ $? -ne 0 ]; then
    echo "❌ Web build failed!"
    exit 1
fi

echo "✅ Web app built successfully!"
echo ""

# Sync to Android
echo "📱 Step 2: Syncing to Android..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Sync failed!"
    exit 1
fi

echo "✅ Sync completed!"
echo ""

# Build APK
echo "🔨 Step 3: Building APK..."
cd android
./gradlew assembleDebug

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed! You need to:"
    echo "  1. Install Android Studio"
    echo "  2. Open android/ folder"
    echo "  3. Build → Build APK(s)"
    echo ""
    exit 1
fi

cd ..

echo ""
echo "✅ APK built successfully!"
echo ""
echo "📱 Your APK is located at:"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "🚀 To install on your phone:"
echo "   adb install android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Or install via USB when connected in debug mode"
echo ""

