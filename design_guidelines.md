# Design Guidelines for DareebDo - Smart Task Manager

## Design Approach

**Selected Approach:** Design System with Linear + Notion Inspiration

**Justification:** This productivity application requires clarity, efficiency, and minimal cognitive load. Drawing from Linear's precision and Notion's flexible layouts while maintaining systematic consistency.

**Core Principles:**
- Information hierarchy through typography and spacing, not visual embellishment
- Efficiency-first interactions with minimal friction
- Clear task status and priority visualization through layout and size
- Focus mode: reduce distractions when user needs to concentrate

---

## Typography System

**Primary Font:** Inter or Geist (Google Fonts CDN)
**Secondary Font:** JetBrains Mono (for time displays, task IDs)

**Hierarchy:**
- App Name/Logo: 2xl to 3xl, font-bold
- Page Headings: xl to 2xl, font-semibold
- Task Titles: base to lg, font-medium
- AI Suggestions/Insights: sm, font-normal with tracking-wide for emphasis
- Body Text: base, font-normal
- Metadata (time, dates, priority): sm to xs, font-medium
- Button Text: sm to base, font-medium

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Tight spacing: p-2, gap-2 (within components)
- Standard spacing: p-4, gap-4 (component padding, small gaps)
- Generous spacing: p-8, gap-8 (section separation)
- Large spacing: p-12 to p-16 (page-level margins)

**Layout Structure:**

**Two-Panel Desktop Layout:**
- Left Sidebar (w-72 to w-80): Navigation, task filters, availability settings
- Main Content Area (flex-1): Active task view, task creation, AI scheduling assistant

**Mobile Layout:**
- Bottom tab navigation
- Full-width content area
- Slide-up modal for task creation
- Floating action button (bottom-right) for quick task add

**Container Widths:**
- Task cards: max-w-4xl
- Task input forms: max-w-2xl
- AI scheduling panel: max-w-3xl

---

## Component Library

### Navigation & Structure

**Top Bar:**
- App branding (left): Icon + "DareebDo" text
- Quick stats (center): "3 urgent • 8 pending • 2h free today"
- User settings (right): notification icon with badge, profile menu

**Sidebar Navigation:**
- Today's Focus
- All Tasks (with count badge)
- Scheduled Tasks
- Completed
- AI Scheduler
- Settings

### Task Components

**Task Input Card:**
- Large textarea with placeholder "What needs to be done?"
- Inline metadata row: Priority selector, Due date picker, Estimated duration
- Submit with "Add Task" button (full-width)
- Quick actions below: "Voice Input" icon button

**Task List Item:**
- Checkbox (left, larger for easy tapping)
- Task title (grows to fill space)
- Priority indicator (right side, subtle badge or border)
- Time estimate + scheduled time (below title, smaller text)
- Metadata row: Created date, category tags
- Hover/focus reveals: Edit icon, Delete icon, More options

**Task Card (Detailed View):**
- Larger checkbox with task title (lg to xl size)
- Full description area (if present)
- Priority level with visual weight (border treatment)
- AI-generated insights panel: "Best time to do this: 2-4pm today"
- Scheduled time block (if assigned)
- Action buttons: Edit, Delete, Mark Complete

### AI Scheduling Interface

**Availability Input Panel:**
- Weekly calendar grid showing free time blocks
- Quick toggles: "Tomorrow", "This Week", "Custom"
- Time picker for daily available hours
- Input: "I have X hours free on [date]"

**AI Schedule Suggestions:**
- Timeline view with suggested task blocks
- Each block shows: Task name, duration, time slot, reasoning
- Accept/Reject buttons per suggestion
- "Optimize Schedule" button to regenerate

**Smart Insights Card:**
- Prominent card showing AI analysis
- "Your priority task: [Task Name]"
- Reasoning in smaller text below
- Time recommendation
- "Start Now" primary action button

### Notification Components

**Browser Notification Design:**
- App icon (left)
- Task title (bold, larger text)
- Scheduled time or "Due now!"
- Quick actions: "Done" / "Snooze 15min"

**In-App Notification Banner:**
- Slide from top
- Urgent tasks: larger, persists longer
- Regular reminders: auto-dismiss after 5s
- Snooze and dismiss controls

### Dashboard Widgets

**Today's Focus Widget:**
- Highlighted task card with subtle border treatment
- Time block allocated
- Progress indicator (if task has subtasks)
- "Focus Mode" button

**Upcoming Tasks Timeline:**
- Vertical timeline with time markers (left)
- Task cards positioned at scheduled times
- Empty slots showing "Free time"

**Productivity Stats (Optional Widget):**
- Completion rate this week
- Streak counter
- Average task completion time

### Forms & Inputs

**All Form Fields:**
- Consistent height: h-12 for single-line inputs
- Padding: px-4 py-3
- Border treatment for focus states
- Label above input (text-sm, font-medium)
- Helper text below (text-xs)

**Select Dropdowns:**
- Priority selector: "Low / Medium / High / Urgent"
- Category selector with icons

**Date/Time Pickers:**
- Native HTML5 inputs for accessibility
- Clear visual indication of selected values

### Buttons & Actions

**Primary Actions:**
- "Add Task", "Schedule Now", "Start Focus Mode"
- px-6 py-3, rounded-md to rounded-lg

**Secondary Actions:**
- "Edit", "Cancel", "Skip"
- px-4 py-2, border treatment

**Floating Action Button (Mobile):**
- Fixed bottom-right
- w-14 h-14, rounded-full
- "+" icon for quick task creation

### Icons
**Icon Library:** Heroicons (CDN)
- Navigation: outline style, size 5-6
- Task items: outline style, size 4-5  
- Buttons: solid style, size 4-5
- Metadata indicators: outline, size 3-4

---

## Accessibility & Interactions

**Keyboard Navigation:**
- Tab through all interactive elements
- Enter to submit forms
- Space to toggle checkboxes
- Escape to close modals

**Touch Targets:**
- Minimum 44×44px for all interactive elements
- Larger checkboxes (h-6 w-6)
- Generous padding around clickable areas

**Focus States:**
- Visible focus rings on all interactive elements
- Consistent across form inputs and buttons

---

## Animations

**Use Sparingly:**
- Task completion: subtle checkmark animation
- Notification slide-in from top
- Task card expansion for details (transition-all duration-200)
- NO scroll-triggered animations
- NO loading spinners unless necessary (skeleton states preferred)

---

## Responsive Behavior

**Mobile (< 768px):**
- Single column layout
- Stack sidebar navigation into bottom tabs
- Full-width task cards
- Floating action button for task creation
- Simplified AI scheduler (step-by-step wizard)

**Tablet (768px - 1024px):**
- Optional collapsible sidebar
- Two-column task grid where appropriate
- Larger touch targets

**Desktop (> 1024px):**
- Full two-panel layout
- Multi-column task grid options
- Hover states for additional actions
- Keyboard shortcuts panel

---

This design creates a focused, efficient productivity tool that prioritizes clarity and usability while incorporating smart AI features seamlessly into the workflow.