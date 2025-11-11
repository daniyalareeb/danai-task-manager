# 🚀 Automated Build Instructions

## GitHub Actions Automated Builds

This project uses GitHub Actions to automatically build both Android and iOS apps in the cloud!

### How It Works

1. **Automatic Builds**: When you push code to the `main` branch, GitHub Actions automatically builds both apps
2. **Manual Builds**: You can also trigger builds manually from the Actions tab
3. **Release Builds**: When you create a GitHub release, both apps are built and attached to the release

### Triggering a Build

#### Option 1: Automatic (Recommended)
Just push your code to the `main` branch:
```bash
git push origin main
```

#### Option 2: Manual Trigger
1. Go to your GitHub repository
2. Click on the **Actions** tab
3. Select **Build iOS App** or **Build Android App**
4. Click **Run workflow** → **Run workflow**

#### Option 3: Create a Release
1. Go to your GitHub repository
2. Click **Releases** → **Create a new release**
3. Tag: `v1.0.0` (or any version)
4. Title: `Release v1.0.0`
5. Click **Publish release**
6. Both apps will be built and attached to the release

### Downloading Built Apps

#### From GitHub Actions
1. Go to **Actions** tab
2. Click on the latest workflow run
3. Scroll down to **Artifacts**
4. Download **ios-ipa** or **android-apk**

#### From Releases Folder
After a successful build, the apps are automatically added to the `releases/` folder:
- **Android**: [Download APK](https://github.com/daniyalareeb/danai-task-manager/raw/main/releases/danai-task-manager-android.apk)
- **iOS**: [Download IPA](https://github.com/daniyalareeb/danai-task-manager/raw/main/releases/danai-task-manager-ios.ipa)

#### From GitHub Releases
1. Go to **Releases** tab
2. Click on the latest release
3. Download the attached APK/IPA files

### iOS Build Notes

⚠️ **Important**: iOS builds require code signing. The GitHub Actions workflow uses automatic signing, which works for:
- Development builds (expire after 7 days)
- Testing on your own devices

For App Store or TestFlight distribution, you'll need to:
1. Set up an Apple Developer account
2. Configure signing certificates in Xcode
3. Update the workflow with your Team ID

### Android Build Notes

✅ Android builds work out of the box! No special configuration needed.

### Troubleshooting

#### Build Fails
- Check the **Actions** tab for error logs
- Common issues:
  - Missing dependencies (check `package.json`)
  - Build errors (check code for syntax errors)
  - Signing issues (iOS only)

#### IPA Not Appearing
- iOS builds require valid signing
- Check if the workflow completed successfully
- Download from Artifacts if not in releases folder

#### APK Not Appearing
- Check if the workflow completed
- Verify Android build completed successfully
- Download from Artifacts if needed

### Workflow Files

- **iOS Build**: `.github/workflows/build-ios.yml`
- **Android Build**: `.github/workflows/build-android.yml`

### Next Steps

1. **First Build**: Push your code and watch the Actions tab
2. **Download**: Get the built apps from Artifacts or releases folder
3. **Test**: Install and test on your devices
4. **Distribute**: Share the download links with users

---

**Note**: GitHub Actions provides 2,000 free build minutes per month for private repos, and unlimited for public repos. Perfect for this project! 🎉

