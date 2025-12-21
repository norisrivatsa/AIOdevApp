from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from bson import ObjectId

from app.models.board import Board
from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


def serialize_board(board_doc: dict) -> dict:
    """Convert MongoDB document to Board model."""
    if board_doc and "_id" in board_doc:
        board_doc["id"] = str(board_doc["_id"])
        del board_doc["_id"]
    return board_doc


async def initialize_default_boards(db: AsyncIOMotorDatabase):
    """Initialize default boards if none exist."""
    count = await db.boards.count_documents({})
    if count == 0:
        default_boards = [
            {
                "name": "Dashboard",
                "order": 0,
                "isDefault": True,
                "layout": {"cards": []},
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Calendar",
                "order": 1,
                "isDefault": True,
                "layout": {"cards": []},
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Courses",
                "order": 2,
                "isDefault": True,
                "layout": {"cards": []},
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Projects",
                "order": 3,
                "isDefault": True,
                "layout": {"cards": []},
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Focus",
                "order": 4,
                "isDefault": True,
                "layout": {"cards": []},
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        ]
        await db.boards.insert_many(default_boards)


@router.get("/", response_model=List[Board])
async def list_boards(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get all boards ordered by their order field."""
    await initialize_default_boards(db)
    boards = await db.boards.find().sort("order", 1).to_list(10)
    return [serialize_board(board) for board in boards]


@router.post("/", response_model=Board, status_code=status.HTTP_201_CREATED)
async def create_board(
    board: Board,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new custom board."""
    # Check board limit (max 7 boards)
    count = await db.boards.count_documents({})
    if count >= 7:
        raise HTTPException(
            status_code=400,
            detail="Maximum number of boards (7) reached"
        )

    board_dict = board.model_dump(exclude={"id"})
    board_dict["createdAt"] = datetime.utcnow()
    board_dict["updatedAt"] = datetime.utcnow()
    board_dict["isDefault"] = False

    result = await db.boards.insert_one(board_dict)
    created_board = await db.boards.find_one({"_id": result.inserted_id})

    return serialize_board(created_board)


@router.get("/{board_id}", response_model=Board)
async def get_board(
    board_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific board by ID."""
    try:
        board = await db.boards.find_one({"_id": ObjectId(board_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid board ID format")

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    return serialize_board(board)


@router.put("/{board_id}", response_model=Board)
async def update_board(
    board_id: str,
    board_update: Board,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update an existing board."""
    try:
        oid = ObjectId(board_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid board ID format")

    # Check if board exists
    existing_board = await db.boards.find_one({"_id": oid})
    if not existing_board:
        raise HTTPException(status_code=404, detail="Board not found")

    # Update board
    update_dict = board_update.model_dump(exclude={"id", "createdAt", "isDefault"})
    update_dict["updatedAt"] = datetime.utcnow()

    await db.boards.update_one(
        {"_id": oid},
        {"$set": update_dict}
    )

    updated_board = await db.boards.find_one({"_id": oid})
    return serialize_board(updated_board)


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(
    board_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a custom board (cannot delete default boards)."""
    try:
        oid = ObjectId(board_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid board ID format")

    # Check if board is default
    board = await db.boards.find_one({"_id": oid})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    if board.get("isDefault"):
        raise HTTPException(
            status_code=400,
            detail="Cannot delete default boards"
        )

    await db.boards.delete_one({"_id": oid})
    return None


@router.put("/reorder")
async def reorder_boards(
    board_orders: List[dict],
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Reorder boards.
    Expects: [{"id": "board_id", "order": 0}, ...]
    """
    for item in board_orders:
        board_id = item.get("id")
        order = item.get("order")

        if board_id and order is not None:
            try:
                oid = ObjectId(board_id)
                await db.boards.update_one(
                    {"_id": oid},
                    {"$set": {"order": order, "updatedAt": datetime.utcnow()}}
                )
            except Exception:
                continue

    return {"message": "Boards reordered successfully"}
