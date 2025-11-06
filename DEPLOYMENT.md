# Deployment Guide - Render.com

This guide walks you through deploying the Daniyal To-Do app to Render.com.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com) (free tier available)
2. **GitHub Repository**: Push your code to GitHub
3. **OpenRouter API Key**: Get a free key from [openrouter.ai](https://openrouter.ai)

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your repository includes:
- ✅ `render.yaml` - Deployment configuration
- ✅ `package.json` - Dependencies and scripts
- ✅ `.gitignore` - Excludes `.env` and build files
- ✅ All source code

### 2. Connect Repository to Render

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"** (for automatic setup)
   - OR click **"New +"** → **"Web Service"** (for manual setup)
3. Connect your GitHub repository
4. Render will detect `render.yaml` and set up services automatically

### 3. Automatic Setup (Recommended)

If using `render.yaml`:

1. Render will automatically:
   - Create a PostgreSQL database (`danai-db`)
   - Create a web service (`danai-task-manager`)
   - Link the database to the web service
   - Set up environment variables

2. **Manual Step Required**: Add `OPENROUTER_API_KEY`
   - Go to your web service → **Environment**
   - Add environment variable:
     - Key: `OPENROUTER_API_KEY`
     - Value: Your OpenRouter API key
     - Mark as **Secret** (recommended)

### 4. Manual Setup (Alternative)

If not using `render.yaml`:

#### Create PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Settings:
   - Name: `danai-db`
   - Database: `danai`
   - User: `danai`
   - Plan: Free (or paid)
   - Region: Oregon (or your preference)
3. Click **"Create Database"**
4. Note the **Internal Database URL** (for environment variables)

#### Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Settings:
   - **Name**: `danai-task-manager`
   - **Environment**: Node
   - **Region**: Oregon
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: (leave empty if root)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid)

4. **Environment Variables**:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (from database, auto-filled if linked)
   - `OPENROUTER_API_KEY` = (your API key - set as secret)
   - `PORT` = (auto-set by Render, don't override)

5. **Health Check**:
   - Path: `/api/tasks`
   - This helps Render know when your app is ready

6. Click **"Create Web Service"**

### 5. Initialize Database Schema

After first deployment:

1. Go to your web service → **Shell** tab
2. Run:
   ```bash
   npm run db:push
   ```
3. This creates all necessary tables

**Alternative**: Use Render's PostgreSQL dashboard to connect and run SQL manually.

### 6. Verify Deployment

1. Check **Events** tab for build/deploy logs
2. Once deployed, visit your app URL (e.g., `https://danai-task-manager.onrender.com`)
3. Test the API: `https://your-app.onrender.com/api/tasks`
   - Should return `[]` (empty array) if working

### 7. Update Mobile App (If Using)

After deployment, update your mobile app:

1. Edit `client/src/lib/queryClient.ts`
2. In `getApiBaseUrl()` function, replace:
   ```typescript
   return 'http://192.168.1.243:5000';
   ```
   With:
   ```typescript
   return 'https://your-app-name.onrender.com';
   ```

3. Rebuild and reinstall the mobile app

## Post-Deployment Configuration

### Environment Variables Checklist

- ✅ `NODE_ENV` = `production`
- ✅ `DATABASE_URL` = (auto-linked from database)
- ✅ `OPENROUTER_API_KEY` = (your API key)
- ✅ `PORT` = (auto-set by Render)

### Database Setup

After deployment, ensure schema is created:
```bash
# In Render Shell
npm run db:push
```

### Monitoring

- **Logs**: Check **Logs** tab for real-time application logs
- **Metrics**: View **Metrics** tab for performance data
- **Health**: Monitor health check endpoint

## Troubleshooting

### Build Fails

- Check **Logs** tab for error messages
- Verify all dependencies are in `package.json`
- Ensure `npm run build` works locally

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check database is in same region as web service
- Ensure database is not paused (free tier sleeps)

### App Not Starting

- Check **Logs** for startup errors
- Verify `npm start` works locally
- Check health check endpoint is accessible

### Server Sleep (Free Tier)

- First request after sleep takes ~50 seconds
- App is configured with 60-second timeouts
- Consider upgrading to paid tier for always-on service

## Free Tier Limitations

- **Server Sleep**: App sleeps after 15 minutes of inactivity
- **Wake Time**: ~50 seconds to respond after sleep
- **Database Sleep**: PostgreSQL free tier also sleeps
- **Build Time**: Limited build minutes per month

## Upgrading to Paid Tier

Benefits:
- Always-on service (no sleep)
- Faster response times
- More build minutes
- Better database performance

## Security Notes

- ✅ Never commit `.env` files
- ✅ Use Render's secret environment variables
- ✅ Enable HTTPS (automatic on Render)
- ✅ Rate limiting is enabled (100 req/15min per IP)

## Support

For deployment issues:
1. Check Render documentation: https://render.com/docs
2. Check application logs in Render dashboard
3. Verify all environment variables are set
4. Test locally first before deploying

---

**Deployment Status**: ✅ Ready for Render.com

The `render.yaml` file is configured for automatic deployment. Simply connect your repository and add the `OPENROUTER_API_KEY` environment variable.



