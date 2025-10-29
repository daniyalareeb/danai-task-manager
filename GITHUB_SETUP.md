# 📦 Setup GitHub Repository

## Option 1: Create Repository via GitHub Website

1. **Go to**: https://github.com/new
2. **Repository name**: `danai-task-manager`
3. **Description**: "AI-powered smart task manager"
4. **Visibility**: Public
5. **DO NOT** check any boxes (no README, .gitignore, or license)
6. Click **"Create repository"**

## Option 2: Use GitHub CLI (if installed)

```bash
gh repo create danai-task-manager --public --source=. --remote=origin --push
```

---

## After Creating Repository

Run these commands:

```bash
# Replace YOUR-USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR-USERNAME/danai-task-manager.git
git push -u origin main
```

---

## Then Deploy to Render!

1. Go to: https://render.com
2. Sign up (FREE)
3. Click "New" → "Web Service"
4. Connect GitHub
5. Select your `danai-task-manager` repository
6. Configure:
   - Name: `danai-task-manager`
   - Region: Oregon
   - Branch: main
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

7. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `OPENROUTER_API_KEY` = (your key from .env)
   - `DATABASE_URL` = (add your Neon DB URL)

8. Click "Create Web Service"

9. **Create Database**:
   - Click "New" → "PostgreSQL"
   - Name: `danai-db`
   - Plan: Free
   - Copy the Internal Database URL
   - Add to Web Service environment as `DATABASE_URL`

10. Wait for deployment (~3 minutes)

11. **Get your URL**: `https://danai-task-manager.onrender.com`

---

## Next: Update APK

Once deployed, I'll help you update the APK to connect to your Render URL!



