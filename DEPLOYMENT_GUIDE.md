# 🚀 Daniyal To-Do - Deployment Guide

## Current Setup

Your app has **two parts**:
1. **Frontend** (what users see)
2. **Backend API** (server that stores tasks, handles AI, etc.)

## 📱 Option 1: Keep Using with Local Server (Current)

**What this means:**
- APK connects to your computer's server at `http://192.168.1.243:5000`
- Server must be running on your computer
- Both phone and computer must be on same WiFi

**Pros:** ✅ Free, works immediately
**Cons:** ❌ Your computer must stay on, limited access

---

## ☁️ Option 2: Deploy to Cloud (Recommended for Production)

Deploy your backend to the cloud so it's always available!

### Quick Deploy Options:

#### **A. Railway (Easiest - Free Tier)**
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Deploy
railway init
railway up

# 4. Set environment variables
railway variables set OPENROUTER_API_KEY=your_key
railway variables set DATABASE_URL=your_db_url
```

Then update `capacitor.config.ts`:
```typescript
server: {
  url: 'https://your-app.railway.app',
  cleartext: false  // HTTPS
}
```

#### **B. Render (Free Tier Available)**
1. Push code to GitHub
2. Connect to Render
3. Deploy
4. Update server URL in config

#### **C. Your Own Server**
- Deploy to any VPS (DigitalOcean, AWS, etc.)
- Run `npm start` 
- Point domain to it

---

## 🔧 What You Need to Do

### For Testing Right Now (Local Server):

1. **Keep server running** on your computer
2. **Make sure phone and computer are on same WiFi**
3. **Rebuild APK with server URL configured**

The APK will connect to your local server and work perfectly!

### For Permanent Solution:

1. Deploy backend to cloud (Railway/Render)
2. Update `capacitor.config.ts` with cloud URL
3. Rebuild APK
4. Install and use from anywhere!

---

## 📝 Quick Commands

```bash
# Rebuild APK with server connection
cd /home/daniyalareeb/MyProjects/AreebTaskWizard
npm run build:web
npx cap sync android
cd android && ./gradlew assembleDebug

# APK location
android/app/build/outputs/apk/debug/app-debug.apk
```

---

**Recommendation:** 
- **For now:** Use with local server (it works!)
- **Later:** Deploy to Railway (free & easy)

