# 🧪 DanTask - Complete Testing Guide

## ✅ All Features Implemented and Ready to Test!

### 1. **Calendar-Style Weekly Availability** ✨
**How to Test:**
1. Go to "AI Scheduler" page
2. You'll see a calendar with 7 days (Sun-Sat)
3. Click "Add" button on any day
4. A time slot appears: 09:00 - 17:00
5. **Edit times** - click the inputs to change start/end times
6. Click another day to add more slots
7. Watch the hour badge update automatically
8. Unsaved slots have blue background + "Unsaved" badge
9. Saved slots have normal background

**Expected Behavior:**
- Can add multiple different time slots
- Can edit times before saving
- Shows total hours for each slot
- "Unsaved" indicator appears on new slots

---

### 2. **Save & Track Functionality** 💾
**How to Test:**
1. Add 2-3 different days with different times
2. Edit their times
3. Click "Save X New Slots" button
4. Slots turn from blue to white (saved!)
5. Badge at top shows "X saved slots"
6. Refresh page - slots persist!
7. Delete a slot - click trash icon
8. It disappears immediately

**Expected Behavior:**
- Slots save to PostgreSQL database
- Persist after page refresh
- Can be deleted
- Shows which are saved vs unsaved

---

### 3. **Multiple Time Slots Per Day** 🕐
**How to Test:**
1. Click "Add" on Monday
2. Edit to: 09:00 - 12:00
3. Click "Add" on Monday again
4. Edit second slot to: 14:00 - 17:00
5. Now you have 2 slots on Monday!
6. Save both
7. Both appear as separate entries

**Expected Behavior:**
- Can add multiple slots for same day
- Each is tracked separately
- Can delete each independently
- Hours calculated per slot

---

### 4. **Smart Notifications** 🔔
**How to Test:**
1. Go to Settings
2. Enable browser notifications
3. Create a task with deadline in 30 minutes
4. Wait - you'll get:
   - ⚠️ "URGENT: Task Name"
   - "Due in X minutes! Did you complete this?"
5. Complete the task
6. Notifications stop!

**Expected Behavior:**
- Notifications ask about completion
- Different urgency levels
- Prompt every 30 minutes
- Stop when task is completed

---

### 5. **AI Auto-Scheduling** 🤖
**How to Test:**
1. Create 5 tasks with durations:
   - "Finish report" (urgent, 2h, deadline tomorrow)
   - "Call client" (high, 1h)
   - "Review code" (medium, 2h)
   - "Email team" (low, 30min)
   - "Plan meeting" (medium, 1h)
2. Set your availability:
   - Monday: 9am-12pm, 2pm-5pm
   - Tuesday: 10am-12pm
3. Click "Prioritize with AI" (needs OPENROUTER_API_KEY)
4. Click "Generate My Schedule"
5. Check "Your Schedule" section at bottom

**Expected Behavior:**
- Tasks scheduled into your time slots
- Higher priority tasks scheduled first
- Tasks fit within available windows
- Deadlines respected
- Shows exact times and reasoning

---

### 6. **Task Understanding by AI** 🧠
**How AI Analyzes:**
- Task title and description
- Priority level (low/medium/high/urgent)
- Estimated duration
- Deadline dates
- Current status
- Dependencies (if any)

**What AI Does:**
1. Analyzes all tasks
2. Calculates urgency scores
3. Identifies which to focus on
4. Suggests optimal order
5. Fits into your schedule
6. Provides reasoning

---

### 7. **Edit/Delete Availability** ✏️
**How to Test:**
1. Add availability
2. Save it
3. Try to edit saved slot - input is disabled
4. Click delete icon
5. Confirms deletion
6. Slot disappears

**Edit Unsaved Slots:**
1. Add a slot
2. Edit times freely
3. Can modify as much as you want
4. Save when ready
5. After saving, can only delete (not edit)

**Expected Behavior:**
- Can edit unsaved slots freely
- Cannot edit saved slots (delete & recreate)
- Delete works for both saved/unsaved
- Immediate visual feedback

---

## 🎯 Complete Workflow Test

### Scenario: Plan Your Week

**Day 1: Set Availability**
1. Open AI Scheduler
2. Add availability:
   - Monday: 9am-12pm, 2pm-5pm
   - Tuesday: 10am-1pm
   - Wednesday: 9am-11am, 3pm-5pm
3. Edit times as needed
4. Save all slots
5. Verify: Badge shows "3 saved slots"

**Day 2: Create Tasks**
1. Create tasks via QuickAdd (+ button bottom-right)
2. Add tasks:
   - "Project proposal" (urgent, 3h, due Wed)
   - "Team standup prep" (high, 1h, due Mon)
   - "Code review" (medium, 2h)
   - "Update docs" (low, 1h, due Fri)
   - "Client feedback" (urgent, 2h, due Mon)

**Day 3: Get AI Schedule**
1. Click "Prioritize with AI"
2. Wait for analysis (uses OpenAI/OpenRouter)
3. Click "Generate My Schedule"
4. View your personalized schedule!

**What You'll See:**
```
✅ Monday, 9am-11am → Project proposal (urgent, 3h)
✅ Monday, 11am-12pm → Team standup prep (high, 1h)
✅ Monday, 2pm-4pm → Client feedback (urgent, 2h)
✅ Tuesday, 10am-12pm → Code review (medium, 2h)
✅ Wednesday, 9am-10am → Update docs (low, 1h)
```

**Day 4: Get Notified**
1. At 9am Monday - Notification: "Time to work on 'Project proposal'! Have you started?"
2. At 9:30am - "Are you making progress on 'Project proposal'?"
3. Complete task at 11am
4. Notifications for that task stop
5. Next task reminders start

---

## 🔧 Testing the AI Features

### Prerequisites:
- Need `OPENROUTER_API_KEY` in `.env`
- Get free key from: https://openrouter.ai/

### Test Priority Feature:
1. Create 10 tasks with mixed priorities
2. Click "Prioritize with AI"
3. Check terminal/console for API call
4. Tasks get `aiPriority` and `aiReasoning` fields
5. View in Dashboard - see AI insights!

### Test Scheduling Feature:
1. Add 5 tasks (with durations)
2. Add availability slots
3. Click "Generate My Schedule"
4. Check terminal for AI scheduling call
5. View generated schedule
6. Verify tasks fit in time slots

---

## 🐛 What to Check if Issues

**Slots not saving?**
- Check browser console for errors
- Check PostgreSQL connection
- Verify DATABASE_URL in .env

**AI not working?**
- Check OPENROUTER_API_KEY in .env
- Look at terminal for API errors
- Verify key is valid on openrouter.ai

**Notifications not appearing?**
- Enable in Settings page
- Check browser permissions
- Some browsers require user click first

**Slots showing wrong times?**
- Try refreshing page
- Check timezone settings
- Verify date format in database

---

## ✅ Success Criteria

**Calendar Works When:**
- ✅ Can add slots to any day
- ✅ Can edit times before saving
- ✅ Can save multiple slots
- ✅ Shows "Unsaved" badge
- ✅ Deletes work correctly
- ✅ Persists after refresh

**AI Works When:**
- ✅ Prioritizes tasks successfully
- ✅ Generates realistic schedules
- ✅ Respects time constraints
- ✅ Provides reasoning
- ✅ Uses free models only

**Notifications Work When:**
- ✅ Prompts about task completion
- ✅ Different urgency messages
- ✅ Reminds at right times
- ✅ Stops when task completed

---

## 🎉 You're Ready!

Your app now has:
- ✅ Calendar-style weekly availability
- ✅ Edit/delete for all slots
- ✅ Persistent storage (PostgreSQL)
- ✅ Smart AI scheduling
- ✅ Intelligent notifications
- ✅ Beautiful UI with gradients
- ✅ Complete task management

**Test everything at: http://localhost:5000**

