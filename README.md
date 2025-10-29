# Daniyal To-Do

AI-powered smart task manager with intelligent scheduling.

## Features

- ✨ **Smart Task Management** - Create, organize, and prioritize tasks
- 🤖 **AI-Powered Scheduling** - Automatically schedule tasks based on availability
- 📅 **Calendar Integration** - Set available time slots for scheduling
- 📱 **Mobile App** - Native Android APK support via Capacitor
- 🔒 **Secure** - Built-in security with rate limiting and CORS protection

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Drizzle ORM)
- **AI**: OpenRouter API (free models)
- **Mobile**: Capacitor (Android)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (or use Render's free PostgreSQL)
- OpenRouter API key (free at https://openrouter.ai)

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file:
   ```
   OPENROUTER_API_KEY=your_key_here
   DATABASE_URL=postgresql://...
   PORT=5000
   ```
4. Push database schema: `npm run db:push`
5. Start dev server: `npm run dev`

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Mobile App

```bash
# Build web assets
npm run build:web

# Sync with Capacitor
npx cap sync android

# Build APK
cd android && ./gradlew assembleDebug
```

## Deployment

This app is configured for Render.com deployment. See deployment configuration in `render.yaml`.

## License

MIT

