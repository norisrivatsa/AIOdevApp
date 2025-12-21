# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack time tracker and learning management desktop application built with React + FastAPI + MongoDB + Electron. The app uses a 5-board navigation system for tracking time spent on courses and projects with comprehensive analytics.

## Development Commands

### Backend (FastAPI)
```bash
# Start backend server
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Or use startup script
cd backend && ./start.sh

# Install dependencies
pip install -r requirements.txt
```

**Backend runs on:** `http://localhost:8000`
**API docs:** `http://localhost:8000/docs` (Swagger) or `http://localhost:8000/redoc`

### Frontend (React + Vite)
```bash
# Start frontend dev server
cd frontend
npm run dev

# Or use startup script
cd frontend && ./start.sh

# Install dependencies
npm install

# Build for production
npm run build

# Lint code
npm run lint
```

**Frontend runs on:** `http://localhost:5173`

### Electron (Desktop App)
```bash
# Start Electron (requires backend + frontend running)
cd electron
npm start

# Build for production
npm run build         # Current platform
npm run build:linux   # Linux (.AppImage, .deb)
npm run build:win     # Windows (.exe)
npm run build:mac     # macOS (.dmg)
```

### MongoDB
Ensure MongoDB is running locally on default port 27017:
```bash
# Check if running
systemctl status mongod

# Start if needed
systemctl start mongod
```

## Architecture

### Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, Zustand (UI state), React Query (server state)
- **Backend:** FastAPI, Motor (async MongoDB), Pydantic
- **Database:** MongoDB (collections: courses, projects, sessions, boards, settings, ui_customization)
- **Desktop:** Electron with preload script for security

### Key Architectural Patterns

**State Management:**
- **Zustand stores** (`frontend/src/stores/`) - UI state, timer state, settings
- **React Query hooks** (`frontend/src/hooks/`) - Server state with automatic caching and refetching
- Timer state persists in `timerStore.js` with interval management for active sessions

**Board System:**
The app uses a unique 5-board navigation system (Dashboard, Calendar, Courses, Projects, Focus) with:
- Keyboard navigation (arrow keys, number keys 1-5)
- Smooth transitions between boards
- Board configurations stored in MongoDB
- Current board index persisted in localStorage via Zustand

**API Layer:**
- Axios client (`frontend/src/lib/api.js`) with centralized base URL configuration
- Route files (`backend/app/routes/`) map to API collections
- All endpoints use async/await with Motor for MongoDB operations
- CORS configured for localhost development

**Time Tracking:**
- Active session stored in both `timerStore` (Zustand) and MongoDB
- Timer runs via `setInterval` incrementing `elapsedSeconds`
- On stop, duration is calculated and session is updated with `endTime`
- Sessions can be course or project type with `referenceId` linking

### Directory Structure

```
backend/app/
  ├── core/           # database.py (MongoDB connection), config.py (settings)
  ├── models/         # Pydantic models (course, project, session, board, settings)
  ├── routes/         # API endpoints (courses, projects, sessions, boards, analytics, settings)
  ├── services/       # Business logic (currently minimal)
  └── main.py         # FastAPI app with lifespan, CORS, router registration

frontend/src/
  ├── boards/         # Full-screen board components (DashboardBoard, CoursesBoard, etc.)
  ├── components/
  │   ├── ui/         # Reusable UI (Button, Input, Modal, Card, Badge, Progress)
  │   ├── layout/     # BoardContainer, TopBar, EditableGridLayout
  │   ├── calendar/   # CalendarView (activity heatmap)
  │   └── charts/     # TimeBreakdownPieChart
  ├── hooks/          # useCourses, useProjects, useSessions, useAnalytics, useKeyboardShortcuts
  ├── stores/         # uiStore, timerStore, settingsStore (Zustand)
  ├── lib/            # api.js (Axios), queryClient.js (React Query config)
  └── utils/          # date.js, constants.js

electron/
  ├── main.js         # Main process: window creation, backend spawning
  ├── preload.js      # Security bridge between renderer and main process
  └── package.json    # electron-builder config for packaging
```

## Important Implementation Details

### Database Indexes
Created automatically on startup in `backend/app/core/database.py`:
- `courses`: indexed on `status`, `createdAt`
- `projects`: indexed on `status`, `createdAt`
- `sessions`: indexed on `type`, `referenceId`, `startTime`
- `boards`: indexed on `order`

### Timer Implementation
The timer uses **client-side intervals** managed by Zustand:
1. `startTimer()` creates a session in MongoDB, starts interval
2. Interval increments `elapsedSeconds` every second
3. `pauseTimer()` clears interval, keeps `elapsedSeconds`
4. `resumeTimer()` restarts interval from current `elapsedSeconds`
5. `stopTimer()` clears interval, updates session with `endTime` and final `duration`

**Important:** Timer state is NOT persisted across page reloads. On app restart, `loadActiveSession()` checks for sessions without `endTime` and resumes them.

### Course Subtopics
Courses have embedded subtopics array (not separate collection):
```python
subtopics: List[Subtopic]  # Each has id, name, completed, order
```
CRUD operations for subtopics are handled via course endpoints with subtopic paths.

### Analytics Aggregation
Analytics endpoints (`backend/app/routes/analytics.py`) use MongoDB aggregation pipelines:
- Time summary: `$match` by date range, `$group` with `$sum` on duration
- Distribution: `$group` by type (course/project)
- Streaks: Custom logic iterating over sorted daily activity
- Daily activity: `$group` by date for calendar heatmap

### Dark Mode
Dark mode state stored in `settingsStore.js` and persisted to localStorage:
- Tailwind dark mode enabled with `class` strategy in `tailwind.config.js`
- TopBar has theme toggle that sets `document.documentElement.classList`
- All components use `dark:` prefix for dark mode styles

### Keyboard Shortcuts
Implemented in `useKeyboardShortcuts.js` hook:
- Arrow keys (←/→): Navigate boards via `uiStore.prevBoard()` / `nextBoard()`
- Number keys (1-5): Jump to board index via `jumpToBoard(index - 1)`
- Cmd/Ctrl+K: Toggle command palette (placeholder)
- Cmd/Ctrl+,: Open settings (placeholder)
- Cmd/Ctrl+B: Toggle sidebar
- Esc: Close modals

## Known Issues & Missing Features

**Missing UI Components:**
- Course/Project create/edit forms exist as modals in `uiStore` but form components not implemented
- Command palette registered but component not built
- Settings panel API works but UI not built
- Manual time entry (backend supports `manualEntry` flag but no UI)

**Placeholder Implementations:**
- GitHub sync button updates `lastFetched` timestamp only (no actual GitHub API integration)
- Board customization backend ready but drag-and-drop UI incomplete
- Idle detection settings exist but no monitoring implementation

**Testing:**
No test suite currently exists. When adding tests:
- Backend: Use pytest with async test fixtures for FastAPI
- Frontend: Consider Vitest (ships with Vite) + React Testing Library

## Common Patterns

### Adding a New API Endpoint

1. Create Pydantic model in `backend/app/models/`:
```python
from pydantic import BaseModel
from typing import Optional

class MyModel(BaseModel):
    id: Optional[str] = None
    name: str
```

2. Create router in `backend/app/routes/`:
```python
from fastapi import APIRouter
from app.core.database import get_database

router = APIRouter()

@router.get("/")
async def get_all():
    db = await get_database()
    items = await db["my_collection"].find({}).to_list(length=100)
    return items
```

3. Register in `backend/app/main.py`:
```python
from app.routes import myroute
app.include_router(myroute.router, prefix=f"{settings.API_V1_PREFIX}/myroute")
```

### Adding a New Board

1. Create board component in `frontend/src/boards/MyBoard.jsx`
2. Import and add to `boardComponents` mapping in `App.jsx`
3. Backend will auto-create board entry on first API call to `/api/boards`

### Using React Query Hooks

All API calls should go through React Query hooks in `frontend/src/hooks/`:
```javascript
import { useCourses } from '../hooks/useCourses';

const MyComponent = () => {
  const { data: courses, isLoading, error } = useCourses();
  // React Query handles caching, refetching, error states
};
```

**Mutations:**
```javascript
const { mutate: createCourse } = useCreateCourse();
createCourse({ title: "New Course", status: "not_started" });
```

### Styling with Tailwind

All components use Tailwind utility classes:
```jsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
    Title
  </h2>
</div>
```

Use consistent spacing: `p-4`, `gap-4`, `space-y-4`
Use consistent colors: `gray-*` scale with dark mode variants

## Environment Configuration

**Frontend** (`frontend/.env`):
```
VITE_API_BASE_URL=http://localhost:8000
```

**Backend** (hardcoded in `backend/app/core/database.py`):
```python
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "timetracker"
```

**Electron** (`electron/main.js`):
Backend spawned as child process with path to Python venv.
