# 🚀 Deploy Daniyal To-Do to Render (FREE)

## Step 1: Deploy Backend to Render

### Quick Steps:

1. **Create Render Account**: https://render.com (it's FREE!)

2. **Connect Your GitHub**:
   - Push this code to GitHub
   - Connect Render to your GitHub repo

3. **Create Web Service**:
   - Click "New" → "Web Service"
   - Connect your repository
   - Use these settings:
     ```
     Name: danai-task-manager
     Region: Oregon (Free)
     Branch: main
     Runtime: Node
     Build Command: npm install && npm run build
     Start Command: npm start
     ```
     
4. **Add Environment Variables**:
   - Click "Environment"
   - Add these variables:
     ```
     NODE_ENV = production
     OPENROUTER_API_KEY = your-api-key-here
     DATABASE_URL = your-neon-db-url-here
     ```

5. **Create Database** (Render's free PostgreSQL):
   - Click "New" → "PostgreSQL"
   - Name: danai-db
   - Plan: Free
   - Click "Create Database"
   - Copy the Internal Database URL
   - Add it to your Web Service environment variables

6. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Copy your app URL (e.g., `https://danai-task-manager.onrender.com`)

---

## Step 2: Update APK to Use Cloud Server

Once deployed, update the app config:

1. **Update Capacitor Config**:
   ```bash
   # Edit capacitor.config.ts
   server: {
     url: 'https://your-app.onrender.com',
     cleartext: false
   }
   ```

2. **Rebuild APK**:
   ```bash
   npm run build:web
   npx cap sync android
   cd android && ./gradlew assembleDebug
   ```

3. **Install on Phone**:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## Alternative: Railway (Easier UI)

Railway is even simpler:

1. **Go to**: https://railway.app
2. **Sign up** with GitHub
3. **Click "New Project"**
4. **Click "Deploy from GitHub"**
5. **Select your repo**
6. **Add environment variables**:
   - `OPENROUTER_API_KEY`
   - `DATABASE_URL` (Neon URL)
7. **Deploy!**
8. **Get URL** (e.g., `https://danai-xyz.up.railway.app`)
9. **Update APK config** with Railway URL
10. **Rebuild APK**

---

## Why This Works

✅ **Free hosting** - Render/Railway free tier  
✅ **Always online** - your phone can connect anywhere  
✅ **No computer needed** - true mobile app  
✅ **Real backend** - AI features work everywhere  

---

## Current Issue (White Screen)

The white screen happens because the app can't connect to a server. Once you deploy and update the URL, it will work perfectly!

---

**Want me to help you deploy now? I can guide you step-by-step!**

