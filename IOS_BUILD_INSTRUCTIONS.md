# iOS Build Instructions

## Prerequisites

1. **macOS** (required - Xcode only runs on macOS)
2. **Xcode** (latest version from App Store)
3. **CocoaPods** - Install with: `sudo gem install cocoapods`
4. **Apple Developer Account** (free account works for development builds)

## Quick Build Steps

### Option 1: Using the Build Script

```bash
# Make script executable
chmod +x build-ios.sh

# Run the build script
./build-ios.sh
```

### Option 2: Manual Build Steps

#### 1. Build Web Assets
```bash
npm run build:web
```

#### 2. Sync with Capacitor
```bash
npx cap sync ios
```

#### 3. Install CocoaPods Dependencies
```bash
cd ios/App
pod install
cd ../..
```

#### 4. Open in Xcode
```bash
npx cap open ios
```

#### 5. Build in Xcode
1. Select your development team in Xcode (Signing & Capabilities)
2. Select a device or simulator
3. Click "Product" → "Archive"
4. Once archived, click "Distribute App"
5. Choose "Development" or "Ad Hoc" distribution
6. Export the IPA file

#### 6. Copy IPA to Releases
```bash
# The IPA will be in the export location
# Copy it to releases folder
cp ~/Desktop/App.ipa releases/danai-task-manager-ios.ipa
```

## Building for TestFlight/App Store

### For TestFlight (Beta Testing)

1. Open Xcode → Product → Archive
2. Click "Distribute App"
3. Select "App Store Connect"
4. Choose "Upload"
5. Follow the prompts to upload to App Store Connect
6. In App Store Connect, add the build to TestFlight

### For App Store Release

1. Follow TestFlight steps above
2. In App Store Connect, submit for App Store review
3. Fill out app information, screenshots, etc.
4. Submit for review

## Development Build (No Signing Required)

For testing on your own device without App Store:

1. Open `ios/App/App.xcworkspace` in Xcode
2. Connect your iPhone/iPad via USB
3. Select your device in Xcode
4. Click "Run" (▶️)
5. Trust the developer certificate on your device (Settings → General → Device Management)

## Troubleshooting

### CocoaPods Installation Issues
```bash
# Update CocoaPods
sudo gem install cocoapods

# Update pod repo
pod repo update

# Clean and reinstall
cd ios/App
rm -rf Pods Podfile.lock
pod install
```

### Signing Issues
- Make sure you're signed in to Xcode with your Apple ID
- Go to Xcode → Preferences → Accounts
- Add your Apple ID
- Select a development team in project settings

### Build Errors
```bash
# Clean build folder
cd ios/App
xcodebuild clean

# Reinstall pods
pod install

# Rebuild
npm run build:web
npx cap sync ios
```

## Building Without macOS

If you don't have access to macOS, you can:

1. **Use GitHub Actions** - Set up CI/CD to build on macOS runners
2. **Use a Mac in the Cloud** - Services like MacStadium or AWS EC2 Mac instances
3. **Use a Friend's Mac** - Build once and distribute the IPA

## GitHub Actions CI/CD (Recommended)

Create `.github/workflows/ios-build.yml`:

```yaml
name: Build iOS

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build web assets
      run: npm run build:web
    
    - name: Sync Capacitor
      run: npx cap sync ios
    
    - name: Install CocoaPods
      run: |
        cd ios/App
        pod install
    
    - name: Build IPA
      run: |
        cd ios/App
        xcodebuild -workspace App.xcworkspace \
          -scheme App \
          -configuration Release \
          -archivePath build/App.xcarchive \
          archive
    
    - name: Export IPA
      run: |
        cd ios/App
        xcodebuild -exportArchive \
          -archivePath build/App.xcarchive \
          -exportPath build \
          -exportOptionsPlist ExportOptions.plist
    
    - name: Upload IPA
      uses: actions/upload-artifact@v3
      with:
        name: ios-ipa
        path: ios/App/build/*.ipa
```

## Notes

- **Development builds** expire after 7 days (free Apple Developer account)
- **Ad Hoc builds** can be distributed to up to 100 devices
- **TestFlight** allows up to 10,000 beta testers
- **App Store** requires a paid Apple Developer account ($99/year)

## Next Steps

Once you have the IPA file:
1. Upload it to the `releases/` folder
2. Commit and push to GitHub
3. Update the download link in `DOWNLOADS.md`

