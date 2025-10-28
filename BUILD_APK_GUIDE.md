# 📱 Building Android APK for Daniyal To-Do

## ✅ What's Already Done

- ✅ Capacitor installed and configured
- ✅ Android platform added
- ✅ Web app built for production
- ✅ Android project structure created in `android/` folder
- ✅ All files synced to Android

## 📋 Prerequisites

You need **Android Studio** to build the APK. Here are two ways to do it:

### **Option 1: Build via Command Line (Requires Android SDK)**

#### Install Android SDK:

1. **Install Android Studio** (if not already installed):
   ```bash
   # Ubuntu/Debian
   wget https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2023.3.1.17/android-studio-2023.3.1.17-linux.tar.gz
   tar -xzf android-studio-*.tar.gz
   cd android-studio/bin
   ./studio.sh
   ```

2. **Set Android SDK Path:**
   ```bash
   # Find your Android SDK location (usually ~/Android/Sdk)
   echo "sdk.dir=/home/daniyalareeb/Android/Sdk" > android/local.properties
   
   # Or set environment variable
   export ANDROID_HOME=/home/daniyalareeb/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

3. **Accept Android Licenses:**
   ```bash
   yes | sdkmanager --licenses
   ```

4. **Build the APK:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

5. **Get your APK:**
   The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

### **Option 2: Build via Android Studio (Easier)**

1. **Open Android Studio:**
   ```bash
   # If Android Studio is installed
   android-studio
   ```

2. **Open the Project:**
   - File → Open
   - Navigate to `/home/daniyalareeb/MyProjects/AreebTaskWizard/android`
   - Click OK

3. **Wait for Gradle Sync:**
   - Android Studio will automatically download dependencies
   - This may take 5-10 minutes on first run

4. **Build the APK:**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Wait for build to complete

5. **Install on Your Phone:**
   - Enable USB Debugging on your phone
   - Connect phone via USB
   - Click "Run" button (green play icon) in Android Studio
   - Or get APK from: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🚀 Quick Build Script

I've created a helper script. Run this:

```bash
cd /home/daniyalareeb/MyProjects/AreebTaskWizard
chmod +x build-apk.sh
./build-apk.sh
```

---

## 📱 Installing the APK

### **Option A: Direct Install (Your Phone is Connected)**

Since your phone is connected via USB in debug mode:

```bash
# Install using adb (Android Debug Bridge)
cd android
./gradlew installDebug
```

Or manually:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### **Option B: Transfer APK to Phone**

1. Copy APK to phone:
   ```bash
   # Find APK
   adb push android/app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/
   ```

2. On your phone:
   - Open File Manager
   - Go to Download folder
   - Tap on `app-debug.apk`
   - Allow installation from unknown sources (if prompted)
   - Install

---

## 🔧 Troubleshooting

### **"SDK location not found" error:**
```bash
# Create local.properties file
echo "sdk.dir=/path/to/android/sdk" > android/local.properties
```

### **"Gradle sync failed" error:**
- Open Android Studio
- File → Sync Project with Gradle Files

### **"adb: command not found":**
```bash
# Install Android Platform Tools
sudo apt install android-tools-adb android-tools-fastboot
```

---

## 📝 Notes

- The APK will connect to your backend at `http://192.168.1.243:5000` (configured in `capacitor.config.ts`)
- For production, deploy your backend to a server and update the URL
- Debug APK is NOT signed - for Play Store, you need a signed release APK

---

## 🎯 Quick Command Reference

```bash
# Build APK
cd android && ./gradlew assembleDebug

# Install on connected device
./gradlew installDebug

# Get APK path
ls android/app/build/outputs/apk/debug/

# Check connected devices
adb devices

# View logs
adb logcat | grep Capacitor
```

---

**Your Daniyal To-Do app is ready to be built! 🎉**

