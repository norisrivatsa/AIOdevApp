from fastapi import APIRouter, HTTPException
from app.core.database import get_database
from app.models.ui_customization import (
    UICustomization,
    UICustomizationCreate,
    UICustomizationUpdate,
    BoardCustomization
)
from datetime import datetime
from bson import ObjectId

router = APIRouter()

def serialize_doc(doc):
    """Convert MongoDB document to dict with string ID"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.get("/")
async def get_ui_customization():
    """Get UI customization for default user"""
    db = await get_database()
    collection = db["ui_customizations"]

    # Get customization for default user
    customization = await collection.find_one({"userId": "default"})

    if not customization:
        # Return default empty customization
        return {
            "userId": "default",
            "boards": [],
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }

    return serialize_doc(customization)

@router.post("/")
async def create_ui_customization(customization: UICustomizationCreate):
    """Create or update UI customization"""
    db = await get_database()
    collection = db["ui_customizations"]

    # Check if customization already exists
    existing = await collection.find_one({"userId": "default"})

    customization_data = {
        "userId": "default",
        "boards": [board.model_dump() for board in customization.boards],
        "updatedAt": datetime.utcnow()
    }

    if existing:
        # Update existing
        customization_data["createdAt"] = existing.get("createdAt", datetime.utcnow())
        await collection.update_one(
            {"userId": "default"},
            {"$set": customization_data}
        )
        result = await collection.find_one({"userId": "default"})
    else:
        # Create new
        customization_data["createdAt"] = datetime.utcnow()
        result = await collection.insert_one(customization_data)
        result = await collection.find_one({"_id": result.inserted_id})

    return serialize_doc(result)

@router.put("/")
async def update_ui_customization(customization: UICustomizationUpdate):
    """Update UI customization"""
    db = await get_database()
    collection = db["ui_customizations"]

    existing = await collection.find_one({"userId": "default"})

    if not existing:
        raise HTTPException(status_code=404, detail="Customization not found")

    customization_data = {
        "boards": [board.model_dump() for board in customization.boards],
        "updatedAt": datetime.utcnow()
    }

    await collection.update_one(
        {"userId": "default"},
        {"$set": customization_data}
    )

    result = await collection.find_one({"userId": "default"})
    return serialize_doc(result)

@router.put("/board/{board_id}")
async def update_board_customization(board_id: str, board: BoardCustomization):
    """Update a specific board's customization"""
    db = await get_database()
    collection = db["ui_customizations"]

    existing = await collection.find_one({"userId": "default"})

    if not existing:
        # Create new customization with this board
        customization_data = {
            "userId": "default",
            "boards": [board.model_dump()],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        result = await collection.insert_one(customization_data)
        result = await collection.find_one({"_id": result.inserted_id})
        return serialize_doc(result)

    # Update or add board
    boards = existing.get("boards", [])
    board_found = False

    for i, b in enumerate(boards):
        if b.get("boardId") == board_id:
            boards[i] = board.model_dump()
            board_found = True
            break

    if not board_found:
        boards.append(board.model_dump())

    await collection.update_one(
        {"userId": "default"},
        {"$set": {"boards": boards, "updatedAt": datetime.utcnow()}}
    )

    result = await collection.find_one({"userId": "default"})
    return serialize_doc(result)

@router.delete("/board/{board_id}")
async def delete_board_customization(board_id: str):
    """Delete a specific board's customization"""
    db = await get_database()
    collection = db["ui_customizations"]

    existing = await collection.find_one({"userId": "default"})

    if not existing:
        raise HTTPException(status_code=404, detail="Customization not found")

    boards = [b for b in existing.get("boards", []) if b.get("boardId") != board_id]

    await collection.update_one(
        {"userId": "default"},
        {"$set": {"boards": boards, "updatedAt": datetime.utcnow()}}
    )

    return {"message": "Board customization deleted"}
