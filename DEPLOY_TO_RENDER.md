# 🚀 Deploy Daniyal To-Do to Render (FREE)

## 📋 Prerequisites

1. **GitHub Account** - Free at https://github.com
2. **Render Account** - Free at https://render.com
3. **OpenRouter API Key** - Get from https://openrouter.ai (free tier available)

---

## Step 1: Push Code to GitHub

### 1.1 Create GitHub Repository

1. Go to: https://github.com/new
2. **Repository name**: `danai-task-manager` (or your preferred name)
3. **Description**: AI-powered smart task manager
4. **Visibility**: **Public** (required for free Render tier)
5. **DO NOT** check any initialization boxes (no README, .gitignore, or license)
6. Click **"Create repository"**

### 1.2 Push Your Code

In your terminal, run:

```bash
# If you haven't initialized git yet
git init
git add .
git commit -m "Initial commit: Daniyal To-Do app"

# Add your GitHub repository as remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/danai-task-manager.git

# Push to GitHub
git branch -M main
git push -u origin main
```

> **Note**: Replace `YOUR-USERNAME` with your actual GitHub username (e.g., `daniyalareeb`)

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. Go to: https://render.com
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account** (recommended)

### 2.2 Create PostgreSQL Database (Choose ONE Option)

#### **Option A: Use Render's PostgreSQL (Recommended for Simplicity)**

1. In Render dashboard, click **"New"** → **"PostgreSQL"**
2. Settings:
   - **Name**: `danai-db` (or your preferred name)
   - **Database**: `danai` (auto-generated, you can change it)
   - **User**: `danai` (auto-generated)
   - **Region**: `Oregon (US West)` - Free tier
   - **PostgreSQL Version**: `16` (latest)
   - **Plan**: **Free** (512MB RAM, 1GB storage)
3. Click **"Create Database"**
4. Wait 2-3 minutes for database to provision
5. **Copy the Internal Database URL**:
   - Go to your database dashboard
   - Scroll to **"Connections"** section
   - Find **"Internal Database URL"** (starts with `postgresql://`)
   - **Click the copy icon** next to it
   - **SAVE THIS URL** - you'll need it in the next step!

> **📌 Where to Find Internal Database URL:**
> - Dashboard → Your Database (danai-db) → "Connections" tab
> - Look for "Internal Database URL" (different from External URL)
> - Format: `postgresql://user:password@d-hostname.render.internal:5432/dbname`

#### **Option B: Use Neon PostgreSQL (External)**

1. Go to: https://neon.tech
2. Sign up (free tier available)
3. Create a new project
4. Copy the connection string (looks like `postgresql://user:pass@ep-xxx.neon.tech/dbname`)
5. Use this as your `DATABASE_URL` in Render

> **💡 Recommendation**: Use **Render's PostgreSQL** (Option A) - it's simpler, free, and works automatically with Internal Database URL.

### 2.3 Create Web Service

1. In Render dashboard, click **"New"** → **"Web Service"**
2. **Connect Repository**:
   - Click **"Connect GitHub"** or **"Connect GitLab"**
   - Authorize Render to access your repositories
   - Select your repository: `YOUR-USERNAME/danai-task-manager`
3. **Configure Service**:
   - **Name**: `danai-task-manager` (or your preferred name)
   - **Region**: `Oregon (US West)` - Free tier
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (512MB RAM)

### 2.4 Add Environment Variables

1. In the Web Service setup, scroll to **"Environment Variables"** section
2. Click **"Add Environment Variable"** for each:

   | Key | Value | Description |
   |-----|-------|-------------|
   | `NODE_ENV` | `production` | Sets production mode |
   | `DATABASE_URL` | `[Internal URL from Step 2.2]` | **Paste the Internal Database URL** you copied |
   | `OPENROUTER_API_KEY` | `sk-or-v1-xxx...` | Your OpenRouter API key from `.env` file |
   | `PORT` | `10000` | Render sets this automatically, but explicit is better |

3. **Important Security Notes**:
   - ✅ **Never commit** `.env` file to Git (already in `.gitignore`)
   - ✅ **Never share** your API keys publicly
   - ✅ **Use Internal Database URL** for Render services (not External URL)
   - ⚠️ The Internal Database URL only works within Render's network

### 2.5 Deploy

1. Review your settings
2. Click **"Create Web Service"**
3. Wait for deployment (3-5 minutes):
   - Render will:
     - Install dependencies (`npm install`)
     - Build your app (`npm run build`)
     - Start the server (`npm start`)
4. **Monitor the logs** in the "Logs" tab
5. Once deployed, copy your **App URL**:
   - Format: `https://danai-task-manager.onrender.com` (or similar)

---

## Step 3: Post-Deployment Verification

### 3.1 Verify Backend is Running

1. **Check Deployment Status**:
   - In Render dashboard, your service should show **"Live"** status (green)
   - If it shows "Building" or errors, check the "Logs" tab

2. **Test API Endpoints**:
   ```bash
   # Replace YOUR-APP-URL with your actual Render URL
   curl https://YOUR-APP-URL.onrender.com/api/tasks
   ```
   
   **Expected Response**: `[]` (empty array) - This means the API is working!

3. **Check Health**:
   - Visit: `https://YOUR-APP-URL.onrender.com/api/tasks`
   - Should return JSON (even if empty): `[]`

### 3.2 Verify Database Connection

Check Render logs for database connection messages:
- ✅ **Good**: "Database connected" or no database errors
- ❌ **Bad**: "Connection refused" or "DATABASE_URL not set"

**If Database Issues**:
1. Verify `DATABASE_URL` is set in Environment Variables
2. Ensure you used **Internal Database URL** (not External)
3. Check database is "Available" status in Render dashboard
4. Database and Web Service must be in **same region** (Oregon)

### 3.3 Verify Environment Variables

In Render dashboard → Your Web Service → Environment:
- ✅ `NODE_ENV` = `production`
- ✅ `DATABASE_URL` = `postgresql://...` (starts with postgresql://)
- ✅ `OPENROUTER_API_KEY` = `sk-or-v1-...` (starts with sk-or-)

---

## Step 4: Update APK to Use Cloud Server

Once your backend is verified and running:

### 4.1 Update Capacitor Config

Edit `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daniyal.todo',
  appName: 'Daniyal To-Do',
  webDir: 'dist/public',
  server: {
    url: 'https://YOUR-APP-URL.onrender.com', // Replace with your Render URL
    cleartext: false // HTTPS only
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
```

**Important**: 
- Replace `YOUR-APP-URL.onrender.com` with your actual Render URL
- Use `https://` (not `http://`)
- The URL should be accessible from your phone's internet

### 4.2 Rebuild APK

```bash
# Build web assets
npm run build:web

# Sync with Capacitor
npx cap sync android

# Build Android APK
cd android && ./gradlew assembleDebug

# The APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

### 4.3 Install on Phone

```bash
# If phone is connected via USB debugging
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Or transfer the APK to your phone and install manually.

---

## Troubleshooting

### Issue: Deployment Fails / Build Errors

**Check Render Logs**:
1. Go to Render dashboard → Your Web Service → "Logs"
2. Look for error messages:
   - ❌ **"npm install" errors**: Check `package.json` syntax
   - ❌ **"DATABASE_URL not set"**: Add environment variable
   - ❌ **"Build failed"**: Check `npm run build` works locally

**Common Fixes**:
- Verify all dependencies in `package.json`
- Ensure `npm run build` works locally first
- Check Node version compatibility (should be 18+)

### Issue: Database Connection Fails

**Symptoms**:
- API returns 500 errors
- Logs show "Connection refused" or "database not found"

**Solutions**:
1. **Use Internal Database URL** (not External):
   - Internal URL works within Render's network
   - External URL is for outside access (not needed here)

2. **Verify Database is Running**:
   - Dashboard → Your Database → Should show "Available"

3. **Check Environment Variable**:
   - Web Service → Environment → `DATABASE_URL` should be set
   - Value should start with `postgresql://`

4. **Region Mismatch**:
   - Database and Web Service must be in **same region** (Oregon)

### Issue: API Returns 429 (Too Many Requests)

**Cause**: Rate limiting is working (this is good!)
**Solution**: Wait 15 minutes or increase limits in `server/index.ts`

### Issue: White Screen in APK

**Causes & Solutions**:
1. **Wrong Server URL**: 
   - Verify `capacitor.config.ts` has correct Render URL
   - Check URL is accessible in browser

2. **CORS Error**:
   - Render deployment should handle CORS automatically
   - If issues persist, check `server/index.ts` CORS config

3. **Network Not Available**:
   - Ensure phone has internet connection
   - Test Render URL in phone's browser first

### Issue: Environment Variables Not Working

**Verify**:
- Environment Variables are set in Render dashboard (not in code)
- After adding env vars, **restart** the service (auto-restart happens on deploy)
- Check logs for "OPENROUTER_API_KEY is not configured" errors

---

## Database Options: Render PostgreSQL vs Neon

### Render PostgreSQL (Recommended)

**Pros**:
- ✅ Free tier available (512MB RAM, 1GB storage)
- ✅ Automatic backups
- ✅ Simple Internal Database URL (no connection string management)
- ✅ Works seamlessly with Render services
- ✅ No separate account needed

**Cons**:
- ⚠️ Free tier spins down after inactivity (wakes up on first request - 30-60s delay)
- ⚠️ Limited to 1GB storage on free tier

**Best For**: Personal projects, simple deployments

### Neon PostgreSQL (Alternative)

**Pros**:
- ✅ Serverless (always ready, no cold starts)
- ✅ Branching features (like Git for databases)
- ✅ More storage (0.5GB free, scales easily)

**Cons**:
- ⚠️ Requires separate account
- ⚠️ Need to manage connection strings
- ⚠️ External service (more configuration)

**Best For**: Projects needing instant responses, database versioning

**Recommendation**: Start with **Render PostgreSQL** for simplicity. Switch to Neon if you need faster cold starts.

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

