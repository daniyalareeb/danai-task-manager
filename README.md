# Daniyal To-Do - AI-Powered Task Manager

A modern, mobile-first task management application with AI-powered scheduling and prioritization. Built with React, TypeScript, Express, and PostgreSQL.

## 🌟 Features

- **✨ Smart Task Management** - Create, organize, and prioritize tasks with ease
- **🤖 AI-Powered Scheduling** - Automatically schedule tasks based on your availability using OpenRouter AI
- **📅 Calendar Integration** - Set available time slots for intelligent scheduling
- **📱 Mobile App** - Native Android APK support via Capacitor with offline-ready notifications
- **🎨 Beautiful UI** - Modern, responsive design optimized for mobile devices
- **🔔 Smart Notifications** - Local notifications that work even when the server sleeps
- **🔒 Secure** - Built-in security with rate limiting, CORS protection, and input validation

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (via Drizzle ORM)
- **AI**: OpenRouter API (free models: llama-3.2, gemini-2.0-flash-exp, etc.)
- **Mobile**: Capacitor 7 (Android support)
- **State Management**: React Query (TanStack Query)
- **UI Components**: Radix UI + shadcn/ui

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use Render's free PostgreSQL)
- OpenRouter API key (free at [https://openrouter.ai](https://openrouter.ai))
- Android SDK (for mobile app development)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd danai-task-manager
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# AI API
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Server
PORT=5000
NODE_ENV=development

# Optional: Frontend URL for CORS
FRONTEND_URL=http://localhost:5000
```

### 3. Database Setup

```bash
# Push database schema to PostgreSQL
npm run db:push
```

### 4. Development

```bash
# Start development server (runs on port 5000)
npm run dev
```

The app will be available at `http://localhost:5000`

## 📦 Build & Production

### Web Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Mobile App Build

```bash
# Build web assets
npm run build:web

# Sync with Capacitor
npx cap sync android

# Open Android Studio
npx cap open android

# Or build APK directly
cd android && ./gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🌐 Deployment to Render

This app is configured for easy deployment on Render.com.

### Automatic Deployment

1. **Connect Repository**: Link your GitHub repository to Render
2. **Create PostgreSQL Database**: Render will automatically create the database from `render.yaml`
3. **Set Environment Variables**: Add `OPENROUTER_API_KEY` in Render dashboard
4. **Deploy**: Render will automatically deploy using the `render.yaml` configuration

### Manual Setup (Alternative)

1. **Create Web Service**:
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Health Check Path: `/api/tasks`

2. **Create PostgreSQL Database**:
   - Plan: Free tier (or paid)
   - Name: `danai-db`

3. **Set Environment Variables**:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: (auto-provided by Render from database)
   - `OPENROUTER_API_KEY`: (your API key - set as secret)
   - `PORT`: (auto-set by Render)

4. **Push Database Schema**:
   ```bash
   # After first deployment, run:
   npm run db:push
   ```

### Render Configuration

The `render.yaml` file includes:
- Web service configuration
- PostgreSQL database setup
- Automatic environment variable linking
- Health check endpoint

### Post-Deployment

After deployment, update your mobile app's API URL:

1. Update `client/src/lib/queryClient.ts`:
   ```typescript
   // In getApiBaseUrl() function, replace:
   return 'http://192.168.1.243:5000';
   // With your Render URL:
   return 'https://your-app-name.onrender.com';
   ```

2. Rebuild and reinstall the mobile app

## 🔧 Configuration

### Server Sleep Handling

The app is optimized for Render's free tier sleep behavior:
- **60-second timeouts**: Handles ~50s server wake-up time
- **Retry logic**: Queries retry once (2s delay), mutations retry twice (5s delay)
- **Local notifications**: Work even when server is asleep

### Mobile App Configuration

For development, update `capacitor.config.ts`:
```typescript
server: {
  url: 'http://YOUR_LOCAL_IP:5000',
  cleartext: true,
}
```

For production, comment out the `server` object to use bundled files.

### API Configuration

The app automatically detects the environment:
- **Web**: Uses relative URLs (works in dev and production)
- **Mobile**: Uses explicit server URL (configured in `queryClient.ts`)

## 📁 Project Structure

```
danai-task-manager/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and API client
│   └── public/             # Static assets
├── server/                 # Express backend
│   ├── routes.ts           # API routes
│   ├── ai.ts               # AI scheduling logic
│   ├── storage.ts          # Database abstraction
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema & Zod validators
├── android/                # Android app (Capacitor)
├── render.yaml             # Render deployment config
└── package.json            # Dependencies and scripts
```

## 🎨 Design Features

- **Priority Color Coding**: Visual left borders on task cards (red/orange/yellow/green)
- **Smart Badges**: "Due today" and "Overdue" indicators
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dark Mode**: Full theme support with system preference detection
- **Animations**: Smooth transitions and hover effects
- **Gradient Cards**: Beautiful stat cards with gradient backgrounds

## 🔐 Security Features

- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Input validation with Zod
- SQL injection protection (Drizzle ORM)
- XSS protection headers
- Content Security Policy (CSP)

## 📱 Mobile Features

- **Native Navigation**: Android back button handling
- **Local Notifications**: Work offline and when server sleeps
- **Responsive Layout**: Optimized for all phone sizes
- **Touch Optimized**: Large touch targets, swipe-friendly
- **Offline Support**: App works with cached data when server unavailable

## 📥 Download Mobile Apps

### Android
Download the latest Android APK from our [Downloads Page](DOWNLOADS.md) or [GitHub Releases](https://github.com/daniyalareeb/danai-task-manager/releases).

### iOS
iOS version coming soon! Check the [Downloads Page](DOWNLOADS.md) for updates.

## 🧪 Testing

```bash
# Type checking
npm run check

# Build test
npm run build
```

## 📝 API Endpoints

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/availability` - Get availability slots
- `POST /api/availability` - Create availability slot
- `POST /api/tasks/prioritize` - AI task prioritization
- `POST /api/schedule/generate` - Generate AI schedule

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) for free AI API access
- [Render](https://render.com) for free hosting tier
- [Capacitor](https://capacitorjs.com) for mobile app framework
- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components

## 📞 Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include error logs and environment details

---

**Built with ❤️ using modern web technologies**
