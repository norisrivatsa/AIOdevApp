from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


db = Database()


async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance."""
    return db.db


async def connect_to_mongo():
    """Connect to MongoDB."""
    logger.info("Connecting to MongoDB...")
    try:
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=10,
            minPoolSize=1,
        )
        db.db = db.client[settings.DATABASE_NAME]

        # Test connection
        await db.client.admin.command('ping')
        logger.info(f"Connected to MongoDB database: {settings.DATABASE_NAME}")

        # Create indexes
        await create_indexes()

    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection."""
    logger.info("Closing connection to MongoDB...")
    if db.client:
        db.client.close()
        logger.info("MongoDB connection closed")


async def create_indexes():
    """Create database indexes for better performance."""
    logger.info("Creating database indexes...")

    # Courses indexes (kept for backward compatibility during migration)
    await db.db.courses.create_index("createdAt")
    await db.db.courses.create_index("status")
    await db.db.courses.create_index([("tags", 1)])

    # Subjects indexes
    await db.db.subjects.create_index("createdAt")
    await db.db.subjects.create_index("status")
    await db.db.subjects.create_index([("tags", 1)])

    # Practices indexes
    await db.db.practices.create_index("createdAt")
    await db.db.practices.create_index("platform")

    # Projects indexes
    await db.db.projects.create_index("createdAt")
    await db.db.projects.create_index("status")
    await db.db.projects.create_index([("tags", 1)])

    # Sessions indexes
    await db.db.sessions.create_index("startTime")
    await db.db.sessions.create_index("referenceId")
    await db.db.sessions.create_index([("type", 1), ("startTime", -1)])
    await db.db.sessions.create_index([("startTime", -1)])

    # Boards indexes
    await db.db.boards.create_index("order")
    await db.db.boards.create_index([("isDefault", 1)])

    logger.info("Database indexes created successfully")
