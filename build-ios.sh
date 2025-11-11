#!/bin/bash

# iOS Build Script for Daniyal To-Do
# This script builds the iOS app and creates an IPA file
# Requirements: macOS with Xcode installed

set -e

echo "🍎 Building iOS app for Daniyal To-Do..."

# Step 1: Build web assets
echo "📦 Building web assets..."
npm run build:web

# Step 2: Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync ios

# Step 3: Install CocoaPods dependencies
echo "📚 Installing CocoaPods dependencies..."
cd ios/App
pod install
cd ../..

# Step 4: Build iOS app using xcodebuild
echo "🔨 Building iOS app..."
cd ios/App

# Build for device (requires signing)
# Replace with your team ID and provisioning profile
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive \
  CODE_SIGN_IDENTITY="iPhone Developer" \
  DEVELOPMENT_TEAM="" \
  PROVISIONING_PROFILE_SPECIFIER=""

# Export IPA
echo "📦 Creating IPA file..."
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist

# Copy IPA to releases folder
echo "📁 Copying IPA to releases folder..."
mkdir -p ../../releases
cp build/*.ipa ../../releases/danai-task-manager-ios.ipa

echo "✅ iOS build complete!"
echo "📱 IPA file: releases/danai-task-manager-ios.ipa"

cd ../..

