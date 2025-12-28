from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routes import courses, subjects, practices, projects, sessions, boards, settings_router, analytics, ui_customization, visions

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info(f"Starting {settings.APP_NAME}")
    await connect_to_mongo()
    yield
    # Shutdown
    logger.info("Shutting down application")
    await close_mongo_connection()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Time Tracker & Learning Management API",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(courses.router, prefix=f"{settings.API_V1_PREFIX}/courses", tags=["courses"])
app.include_router(subjects.router, prefix=f"{settings.API_V1_PREFIX}/subjects", tags=["subjects"])
app.include_router(practices.router, prefix=f"{settings.API_V1_PREFIX}/practices", tags=["practices"])
app.include_router(projects.router, prefix=f"{settings.API_V1_PREFIX}/projects", tags=["projects"])
app.include_router(sessions.router, prefix=f"{settings.API_V1_PREFIX}/sessions", tags=["sessions"])
app.include_router(boards.router, prefix=f"{settings.API_V1_PREFIX}/boards", tags=["boards"])
app.include_router(settings_router.router, prefix=f"{settings.API_V1_PREFIX}/settings", tags=["settings"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_PREFIX}/analytics", tags=["analytics"])
app.include_router(ui_customization.router, prefix=f"{settings.API_V1_PREFIX}/ui-customization", tags=["ui-customization"])
app.include_router(visions.router, prefix=f"{settings.API_V1_PREFIX}/visions", tags=["visions"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
