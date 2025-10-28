# 🚀 Quick Start Guide

## What You Need (2 minutes setup)

### 1️⃣ Get Your Free API Key

**Visit:** https://openrouter.ai/
- Click "Sign Up" 
- Create free account
- Go to "Keys" section
- Copy your API key

### 2️⃣ Add to .env File

```bash
# Copy the example file
cp .env.example .env

# Edit .env and paste your key
nano .env  # or use your editor
```

In `.env`, change:
```
OPENROUTER_API_KEY=your_openrouter_key_here
```

To your actual key:
```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

### 3️⃣ (Optional) Add Database

Currently using **in-memory storage** (works but data resets on restart).

To persist data, add PostgreSQL:
- **Get free DB:** https://neon.tech
- Copy connection string to `DATABASE_URL` in `.env`
- Run: `npm run db:push`

---

## 🎯 That's It!

Now you can:

1. **Create tasks** with durations
2. **Set your availability** (when you're free)
3. **Click "Prioritize with AI"** 
4. **Click "Generate My Schedule"**
5. **Get your personalized schedule!** 📅

---

## 📝 Example Usage

### Create a Task:
```
Title: Finish project report
Priority: Urgent
Duration: 2 hours
Deadline: Tomorrow
```

### Set Availability:
```
Monday, Jan 15:
- 9:00 AM - 12:00 PM
- 2:00 PM - 5:00 PM
```

### AI Generates:
```
Monday Schedule:
✅ 9:00 AM - 11:00 AM → Finish project report
✅ 11:00 AM - 12:00 PM → Review code (from other tasks)
✅ 2:00 PM - 4:00 PM → Email team
```

---

## ⚡ What's Free

- ✅ **100% free AI** - Uses only free models
- ✅ **No credit card** needed for OpenRouter
- ✅ **Unlimited tasks** and scheduling
- ✅ **All AI features** - prioritization and scheduling

---

## 🐛 Troubleshooting

**API error?**
- Make sure OPENROUTER_API_KEY is in .env
- Restart server: `npm run dev`

**Can't schedule?**
- Make sure tasks have durations set
- Add availability time slots
- Run "Prioritize with AI" first

**Data gone?**
- Add database (see DATABASE_SETUP.md)
- Data persists with PostgreSQL

---

## 📞 Need Help?

Check:
- `SETUP_GUIDE.md` - Detailed setup
- `DATABASE_SETUP.md` - Database options
- Terminal logs for errors

---

## 🎉 You're Ready!

Your app is configured to use **only free models** and is ready to create smart schedules! 

Visit: http://localhost:5000

