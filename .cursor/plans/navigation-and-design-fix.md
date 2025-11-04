# Navigation Fix & Design Visibility Enhancement

## Problem 1: Navigation Issue
- When going from "Today's Focus" (dashboard `/`) to "New Task" (`/tasks/new`) and back, it goes to `/tasks` instead of back to dashboard
- The back button in `new-task.tsx` always goes to `/tasks` (line 41)
- After creating a task, it redirects to `/tasks` (line 24) instead of previous location

## Problem 2: Design Changes Not Visible
- Priority borders might be too subtle (4px might not be visible enough)
- Badges might be too small or colors too muted
- Gradient backgrounds might be too subtle
- Color changes might not be noticeable

## Solution

### Part 1: Fix Navigation

**File: `client/src/pages/new-task.tsx`**

1. Use browser history for back button:
   - Change line 41 from `onClick={() => setLocation("/tasks")}` to `onClick={() => window.history.back()}`
   - If no history, fallback to `/` (dashboard)

2. Remember previous location:
   - Store previous location in state or use `useLocation` to track referrer
   - After task creation, go back to previous location instead of `/tasks`
   - Use `window.history.back()` or store previous location in sessionStorage

### Part 2: Make Design Changes More Visible

**File: `client/src/components/task-card.tsx`**

1. **Priority Borders**:
   - Increase border width from `border-l-4` to `border-l-[6px]` or `border-l-[8px]`
   - Make colors more vibrant:
     - Urgent: Use brighter red (`border-l-red-600` or `border-l-destructive`)
     - High: Use brighter orange (`border-l-orange-600`)
     - Medium: Use brighter yellow (`border-l-yellow-500`)
     - Low: Use brighter green (`border-l-green-600`)

2. **Badges**:
   - Increase badge size and padding
   - Make colors more vibrant and visible
   - Add border or shadow to make them stand out

3. **Priority Task Card Border**:
   - Make border thicker and more visible
   - Use same color scheme as task cards

**File: `client/src/pages/dashboard.tsx`**

1. **Stat Card Colors**:
   - Ensure gradients are more vibrant
   - Add more contrast to numbers

2. **Background Gradient**:
   - Make dashboard background gradient more visible
   - Increase opacity of gradient color

## Implementation Steps

1. Fix navigation in `new-task.tsx`:
   - Update back button to use `window.history.back()`
   - Update success redirect to use previous location or browser history

2. Enhance priority borders:
   - Increase thickness
   - Use brighter colors
   - Ensure visibility on both light and dark themes

3. Enhance badges:
   - Increase size
   - Brighten colors
   - Add visual emphasis

4. Enhance gradients:
   - Increase opacity
   - Add more contrast
   - Ensure visibility

## Testing

- [ ] Navigate from dashboard → new task → back button → should return to dashboard
- [ ] Create task from dashboard → should return to dashboard
- [ ] Navigate from tasks page → new task → back button → should return to tasks page
- [ ] Priority borders are clearly visible on task cards
- [ ] Priority border is visible on priority task card
- [ ] "Due today" and "Overdue" badges are clearly visible
- [ ] Dashboard background gradient is visible
- [ ] Stat card colors are vibrant and visible

