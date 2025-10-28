# DanTask - AI-Powered Smart Task Manager

## Overview
DanTask is a personalized, AI-powered task management application designed for Daniyal Areeb. The app intelligently prioritizes tasks, creates optimized schedules based on user availability, and provides persistent browser notifications to keep users focused until tasks are completed.

## Core Features
- **Smart Task Creation**: Create tasks with title, description, priority, deadline, and estimated duration
- **AI-Powered Prioritization**: Uses OpenRouter API (DeepSeek/Kimi models) to intelligently analyze and prioritize tasks
- **Intelligent Scheduling**: AI creates optimized schedules based on user's available hours
- **Browser Notifications**: Persistent push notifications remind users about pending tasks
- **Multiple Views**: 
  - Today's Focus: Highlights the most important task
  - All Tasks: Filterable and searchable task list
  - Scheduled: Calendar view of AI-scheduled tasks
  - Completed: Track accomplished tasks
  - AI Scheduler: Manage availability and generate schedules

## Technology Stack
### Frontend
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Shadcn UI components
- Tailwind CSS for styling
- date-fns for date handling
- Lucide React for icons

### Backend
- Express.js server
- In-memory storage (MemStorage)
- OpenRouter API integration for AI features
- WebSocket support for real-time notifications

## Project Structure
```
client/
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn UI components
│   │   ├── app-sidebar.tsx  # Main navigation sidebar
│   │   ├── task-card.tsx    # Task display component
│   │   ├── task-form.tsx    # Task creation/edit form
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── pages/
│   │   ├── dashboard.tsx    # Today's Focus page
│   │   ├── tasks.tsx        # All tasks with filters
│   │   ├── new-task.tsx     # Create new task
│   │   ├── scheduler.tsx    # AI scheduling interface
│   │   ├── scheduled.tsx    # View scheduled tasks
│   │   ├── completed.tsx    # Completed tasks
│   │   └── settings.tsx     # App settings
│   ├── lib/
│   │   └── queryClient.ts   # API request handling
│   └── App.tsx              # Main app component
server/
├── routes.ts                # API endpoints
├── storage.ts               # Data storage interface
└── ai.ts                    # OpenRouter AI integration
shared/
└── schema.ts                # Shared types and schemas
```

## Data Models
### Task
- id, title, description
- priority: low | medium | high | urgent
- status: pending | scheduled | in-progress | completed
- estimatedDuration, deadline
- scheduledStart, scheduledEnd
- aiPriority, aiReasoning
- completed, completedAt, createdAt

### Availability
- id, date, availableHours
- startTime, endTime, createdAt

## API Endpoints
- `GET /api/tasks` - Fetch all tasks
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/prioritize` - AI prioritization
- `GET /api/availability` - Fetch availability
- `POST /api/availability` - Add availability
- `POST /api/schedule/generate` - Generate AI schedule

## Environment Variables
- `OPENROUTER_API_KEY` - API key for OpenRouter AI services

## Design System
- Font: Inter (sans), JetBrains Mono (mono)
- Color scheme: Blue primary (#4C8BF5), with light/dark mode support
- Components: Shadcn UI with custom theming
- Spacing: Consistent 4, 8, 12, 16px spacing system
- Responsive: Mobile-first design with sidebar navigation

## User Preferences
- Theme: Light/Dark mode toggle
- Notifications: Browser push notifications enabled via Settings
- Timezone: Automatic detection using device timezone

## Recent Changes
- 2025-10-28: Complete DanTask MVP implementation
- Beautiful, polished UI with exceptional visual quality
- Full backend with OpenRouter AI integration for task prioritization and scheduling
- Browser notification system with persistent reminders
- Theme system with light/dark mode support
- Comprehensive task management with filtering and search
- All API endpoints functional with proper validation
- Notification permission flow implemented on first load
- Completed tasks automatically clear their reminders

## Development Notes
- Use `npm run dev` to start the application
- Frontend runs on Vite development server
- Backend uses Express with in-memory storage
- Browser notifications require user permission (requested in Settings)
- AI features require valid OPENROUTER_API_KEY environment variable
