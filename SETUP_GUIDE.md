# DanTask - Setup Guide

## 🎯 What You Need to Make It Work

### 1. **OPENROUTER_API_KEY** (Required for AI Features)

The scheduler needs an API key to use AI for prioritizing and scheduling tasks.

**Steps to get your key:**
1. Go to https://openrouter.ai/
2. Sign up for a free account
3. Go to Keys section
4. Create a new key
5. Copy the key

**How to add it:**
```bash
# Create a .env file in the project root
echo 'OPENROUTER_API_KEY=your_key_here' > .env
```

**Or in Replit:**
1. Go to Tools → Secrets
2. Add secret: `OPENROUTER_API_KEY` with your key

---

### 2. **What You Need to Provide**

#### ✅ For Basic Task Management:
- Task titles
- Optional: descriptions, priorities, deadlines, durations

#### ✅ For Smart Scheduling:
1. **Your availability** - When are you free?
   - Pick dates
   - Set time slots (e.g., Monday 9am-12pm, 2pm-5pm)
   
2. **Task information:**
   - **Estimated duration** (critical!)
   - **Deadlines** (optional but helps)
   - **Priority levels** (low/medium/high/urgent)

---

## 🚀 How to Use

### Step 1: Create Tasks
1. Click "New Task" or use the floating + button
2. Fill in:
   - Title (required)
   - Estimated duration (required for scheduling)
   - Priority
   - Deadline (optional but helpful)
   - Description (optional)

### Step 2: Set Your Availability
1. Go to "AI Scheduler"
2. Add available days:
   - Pick a date
   - Set time slots when you're free
   - Add multiple slots per day (e.g., morning + afternoon)
3. Save each day

Example:
```
Monday, Jan 15:
- 9:00 AM - 12:00 PM
- 2:00 PM - 5:00 PM

Tuesday, Jan 16:
- 10:00 AM - 1:00 PM
- 3:00 PM - 6:00 PM
```

### Step 3: Let AI Prioritize
1. Click "Prioritize with AI"
2. AI analyzes your tasks based on:
   - Deadlines
   - Durations
   - Priorities
   - Urgency

### Step 4: Generate Schedule
1. Click "Generate My Schedule"
2. AI fits tasks into your available time slots
3. You get a schedule with exact times!

Example output:
```
Monday, Jan 15:
✅ 9:00 AM - 11:00 AM → Finish report (urgent, 2h)
✅ 11:00 AM - 12:00 PM → Call client (high, 1h)
✅ 2:00 PM - 4:00 PM → Review code (medium, 2h)
```

---

## 📊 What the AI Needs to Know

### From YOU:
1. ✅ When you're free (dates + time slots)
2. ✅ Task durations (estimated hours)
3. ✅ Task priorities
4. ✅ Deadlines

### From AI:
1. ✅ Prioritization scores
2. ✅ Suggested focus tasks
3. ✅ Optimized schedule
4. ✅ Time slot matching

---

## 🔧 Configuration

### Current Storage:
- Uses **in-memory storage** (data resets on server restart)
- Add `DATABASE_URL` to persist data

### To add database:
```bash
# In .env or Replit Secrets
DATABASE_URL=your_postgresql_url
```

---

## 💡 Tips for Best Results

1. **Be specific with time** - Don't just say "all day", give specific windows
2. **Estimate durations realistically** - Better estimates = better schedule
3. **Set deadlines** - Helps AI prioritize urgent tasks
4. **Add multiple slots** - Can schedule morning + afternoon work separately
5. **Regularly update availability** - Add new available days as needed

---

## ⚠️ Troubleshooting

### AI features not working?
- Check if OPENROUTER_API_KEY is set
- Look at terminal for API errors

### Schedule not generating?
- Make sure you have:
  - ✅ Tasks with durations
  - ✅ Available time slots set
  - ✅ Active tasks (not completed)

### Notifications not appearing?
- Check browser permissions in Settings
- Ensure notifications are enabled in browser
- Some browsers require user interaction before allowing notifications

---

## 🎉 Current Status

✅ **Working Now:**
- Task creation and management
- Basic scheduling
- Beautiful UI with gradients
- Quick-add floating button
- Weekly availability input

⚠️ **Needs API Key:**
- AI prioritization
- AI schedule generation

🔧 **To Make Fully Functional:**
1. Get OPENROUTER_API_KEY
2. Add to environment
3. Create tasks with durations
4. Set your availability
5. Let AI schedule!

---

## 📝 Example Workflow

```bash
# 1. Get your API key
# Visit https://openrouter.ai/

# 2. Add it to environment
echo 'OPENROUTER_API_KEY=sk-or-...' > .env

# 3. Restart server
npm run dev

# 4. Use the app:
# - Create tasks with durations
# - Set your available time slots
# - Click "Prioritize with AI"
# - Click "Generate My Schedule"
# - Get your personalized schedule!
```

