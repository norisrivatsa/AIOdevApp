# Time Tracker API - Backend

FastAPI backend server for the Time Tracker application.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your MongoDB connection details
```

4. Run the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── app/
│   ├── core/          # Core functionality (config, database)
│   ├── models/        # Pydantic models
│   ├── routes/        # API endpoints
│   ├── schemas/       # Additional schemas
│   ├── services/      # Business logic
│   └── main.py        # FastAPI application
├── requirements.txt   # Python dependencies
└── .env.example      # Environment variables template
```

## API Endpoints

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create course
- `GET /api/courses/{id}` - Get course
- `PUT /api/courses/{id}` - Update course
- `DELETE /api/courses/{id}` - Delete course
- `POST /api/courses/{id}/subtopics` - Add subtopic
- `PUT /api/courses/{id}/subtopics/{subtopic_id}` - Update subtopic
- `DELETE /api/courses/{id}/subtopics/{subtopic_id}` - Delete subtopic

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `POST /api/projects/{id}/sync-github` - Sync GitHub data

### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/active` - Get active session
- `GET /api/sessions/{id}` - Get session
- `PUT /api/sessions/{id}` - Update session
- `DELETE /api/sessions/{id}` - Delete session
- `GET /api/sessions/stats/summary` - Get time summary

### Boards
- `GET /api/boards` - List all boards
- `POST /api/boards` - Create board
- `GET /api/boards/{id}` - Get board
- `PUT /api/boards/{id}` - Update board layout
- `DELETE /api/boards/{id}` - Delete board
- `PUT /api/boards/reorder` - Reorder boards

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings

### Analytics
- `GET /api/analytics/time-summary` - Time summary
- `GET /api/analytics/distribution` - Time distribution
- `GET /api/analytics/streaks` - Activity streaks
- `GET /api/analytics/progress` - Overall progress
- `GET /api/analytics/daily-activity` - Daily activity data
