# Time Tracker & Learning Management App - MVP

A full-stack desktop application for tracking time spent on courses and projects, with comprehensive learning management features.

## 🎯 Features

### ✅ Implemented

- **5 Board Navigation System** with smooth transitions
- **Dashboard Board** - Overview with stats, active courses/projects
- **Calendar Board** - Activity heatmap and daily breakdown
- **Courses Board** - Full CRUD for courses with subtopics and progress tracking
- **Projects Board** - Full CRUD for projects with GitHub integration placeholder
- **Focus Board** - Timer interface with start/stop/pause controls
- **Time Tracking** - Active session management with notes
- **Analytics** - Time summaries, streaks, progress metrics, daily activity
- **Dark/Light Theme** with persistent settings
- **Keyboard Shortcuts** - Arrow keys for navigation, ⌘K for command palette, etc.
- **Responsive Design** - Optimized for desktop (1280px+ recommended)

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React + JavaScript, Tailwind CSS, Vite
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Desktop**: Electron
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Icons**: Lucide React

### Project Structure

```
time-tracker-app/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── core/      # Database, config
│   │   ├── models/    # Pydantic models
│   │   └── routes/    # API endpoints
│   ├── venv/          # Python virtual environment
│   ├── requirements.txt
│   └── start.sh       # Backend startup script
├── frontend/          # React frontend
│   ├── src/
│   │   ├── boards/    # Board components
│   │   ├── components/# UI components
│   │   ├── hooks/     # React Query hooks
│   │   ├── lib/       # API client
│   │   ├── stores/    # Zustand stores
│   │   └── utils/     # Utilities
│   ├── package.json
│   └── start.sh       # Frontend startup script
└── electron/          # Electron wrapper
    ├── main.js        # Main process
    ├── preload.js     # Preload script
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **MongoDB** running locally (default port 27017)
- **Git**

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo>
   cd time-tracker-app
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```

4. **Setup Electron** (for desktop app):
   ```bash
   cd ../electron
   npm install
   ```

### Running in Development

#### Option 1: Run Backend and Frontend Separately

**Terminal 1 - Backend**:
```bash
cd backend
./start.sh
# Or manually:
# source venv/bin/activate && uvicorn app.main:app --reload
```

**Terminal 2 - Frontend**:
```bash
cd frontend
./start.sh
# Or manually:
# npm run dev
```

Access the app at `http://localhost:5173`

#### Option 2: Run as Electron Desktop App

**Terminal 1 - Backend**:
```bash
cd backend
./start.sh
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 3 - Electron**:
```bash
cd electron
npm start
```

### Building for Production

1. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Build Electron App**:
   ```bash
   cd electron
   npm run build           # Build for current platform
   npm run build:linux     # Build for Linux
   npm run build:win       # Build for Windows
   npm run build:mac       # Build for macOS
   ```

   Output installers will be in `electron/dist/`

## 📖 Usage Guide

### Navigation

- **Arrow Keys (← / →)**: Navigate between boards
- **Number Keys (1-5)**: Jump to specific board
- **⌘K** / **Ctrl+K**: Open command palette (coming soon)
- **⌘,** / **Ctrl+,**: Open settings (coming soon)
- **Esc**: Close modals

### Creating Courses

1. Navigate to **Courses Board**
2. Click **"New Course"**
3. Fill in title, description, status, dates, and time goal
4. Add subtopics to track progress
5. Click **Save**

### Creating Projects

1. Navigate to **Projects Board**
2. Click **"New Project"**
3. Fill in name, description, repository URL, and status
4. Click **Save**
5. Optionally sync GitHub data

### Tracking Time

1. Navigate to **Focus Board**
2. Select type (Course or Project)
3. Select specific item from dropdown
4. Click **"Start Session"**
5. Add notes during session
6. Click **"Stop"** when done

### Viewing Analytics

- **Dashboard Board**: Quick overview of all activities
- **Calendar Board**: Heatmap showing daily activity intensity
- Daily breakdowns show total time and session count per day

## 🐛 Troubleshooting

### Backend won't start
- Ensure MongoDB is running: `systemctl status mongod`
- Check Python version: `python3 --version` (needs 3.10+)

### Frontend won't start
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (needs 18+)

### Electron won't start
- Ensure backend and frontend are running first
- Check console for errors

## 📝 Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide.

## 🤝 Contributing

This is an MVP. Contributions are welcome!

## 📄 License

MIT License
