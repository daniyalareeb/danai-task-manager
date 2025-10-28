# Database Setup Guide

## 🗄️ Recommended: PostgreSQL (Already Configured)

Your project is already set up for PostgreSQL with Drizzle ORM.

### Best Free PostgreSQL Options:

#### Option 1: Neon ⭐ (Recommended)
**Why:** Easiest setup, generous free tier, serverless
- **Sign up:** https://neon.tech
- **Free tier:** 
  - 0.5 GB storage
  - Unlimited projects
  - Serverless auto-pause after 5 min inactivity
- **How to get URL:**
  1. Create account
  2. Create new project
  3. Copy connection string
  4. Add to `.env`:
     ```
     DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname
     ```

#### Option 2: Supabase
- **Sign up:** https://supabase.com
- **Free tier:** 
  - 500 MB database
  - 2 GB bandwidth
- **How to get URL:**
  1. Create project
  2. Go to Settings → Database
  3. Copy "Connection string" → URI
  4. Add to `.env`

#### Option 3: Railway
- **Sign up:** https://railway.app
- **Free tier:** $5 credit/month
- PostgreSQL plugin available

### Setup Steps:

```bash
# 1. Get your DATABASE_URL from Neon/Supabase
# It should look like:
# postgresql://user:password@host:5432/dbname

# 2. Add to .env file
echo 'DATABASE_URL=your_connection_string_here' >> .env

# 3. Push schema to database
npm run db:push

# 4. Restart server
npm run dev
```

---

## 🍃 Alternative: MongoDB (If you prefer)

### MongoDB Atlas Free Tier
- **Sign up:** https://www.mongodb.com/cloud/atlas
- **Free tier:**
  - 512 MB storage
  - Shared cluster

### Setup MongoDB:
```bash
# 1. Get your MONGODB_URI from Atlas
# Looks like: mongodb+srv://user:pass@cluster.mongodb.net/dbname

# 2. Add to .env
echo 'MONGODB_URI=your_mongo_uri_here' >> .env
```

**⚠️ Note:** You'll need to update the storage layer to use MongoDB instead of in-memory storage. The project currently uses MemStorage.

---

## 🔧 Current Status

### Right Now:
- ✅ Using **in-memory storage** (MemStorage)
- ✅ Data resets when server restarts
- ✅ No database needed for testing

### To Persist Data:
- Add `DATABASE_URL` for PostgreSQL
- Run `npm run db:push` to create tables
- Data will persist!

---

## 🚀 Quick Start with Neon

```bash
# 1. Visit https://neon.tech and sign up

# 2. Create a new project

# 3. Copy your connection string

# 4. Create .env file
cp .env.example .env
# Edit .env and add:
# DATABASE_URL=your_neon_connection_string

# 5. Push schema
npm run db:push

# 6. Restart
npm run dev
```

---

## 📊 Database Schema

Your app uses these tables:

### `tasks` table:
- id, title, description
- priority, status
- estimatedDuration, deadline
- scheduledStart, scheduledEnd
- aiPriority, aiReasoning
- completed, completedAt, createdAt

### `availability` table:
- id, date, availableHours
- startTime, endTime, createdAt

---

## ✅ Recommendation

**Use Neon (PostgreSQL)** because:
1. ✅ Already configured in your project
2. ✅ Drizzle ORM ready to use
3. ✅ Free tier is very generous
4. ✅ Serverless (auto-pauses to save money)
5. ✅ Easy setup

**No need for MongoDB** - would require rewriting storage layer.

