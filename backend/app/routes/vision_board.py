from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId

from app.core.database import get_database
from app.models.vision_card import VisionCard, VisionCardCreate, VisionCardUpdate
from app.models.vision_goal import VisionGoal, VisionGoalCreate, VisionGoalUpdate
from app.models.vision_quote import VisionQuote, VisionQuoteCreate, VisionQuoteUpdate

router = APIRouter()


# Helper function to serialize MongoDB document
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc


# ==================== QUOTES ENDPOINTS ====================

@router.get("/quotes", response_model=List[VisionQuote])
async def get_quotes():
    """Get all active quotes for the user, ordered by order field"""
    db = await get_database()
    quotes = await db["vision_quotes"].find({"isActive": True}).sort("order", 1).to_list(length=100)
    return [serialize_doc(quote) for quote in quotes]


@router.get("/quotes/all", response_model=List[VisionQuote])
async def get_all_quotes():
    """Get all quotes including inactive ones"""
    db = await get_database()
    quotes = await db["vision_quotes"].find({}).sort("order", 1).to_list(length=100)
    return [serialize_doc(quote) for quote in quotes]


@router.post("/quotes", response_model=VisionQuote, status_code=status.HTTP_201_CREATED)
async def create_quote(quote: VisionQuoteCreate):
    """Create a new quote"""
    db = await get_database()

    # Check if we already have 15 quotes (max limit)
    count = await db["vision_quotes"].count_documents({})
    if count >= 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum of 15 quotes allowed"
        )

    quote_dict = quote.model_dump()
    quote_dict["createdAt"] = datetime.utcnow()

    result = await db["vision_quotes"].insert_one(quote_dict)
    created_quote = await db["vision_quotes"].find_one({"_id": result.inserted_id})
    return serialize_doc(created_quote)


@router.put("/quotes/{quote_id}", response_model=VisionQuote)
async def update_quote(quote_id: str, quote: VisionQuoteUpdate):
    """Update a quote"""
    db = await get_database()

    update_data = {k: v for k, v in quote.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    result = await db["vision_quotes"].update_one(
        {"_id": ObjectId(quote_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found"
        )

    updated_quote = await db["vision_quotes"].find_one({"_id": ObjectId(quote_id)})
    return serialize_doc(updated_quote)


@router.delete("/quotes/{quote_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quote(quote_id: str):
    """Delete a quote"""
    db = await get_database()

    # Check if this is the last active quote
    active_count = await db["vision_quotes"].count_documents({"isActive": True})
    quote = await db["vision_quotes"].find_one({"_id": ObjectId(quote_id)})

    if quote and quote.get("isActive") and active_count <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the last active quote. At least one quote must remain active."
        )

    result = await db["vision_quotes"].delete_one({"_id": ObjectId(quote_id)})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found"
        )


@router.put("/quotes/reorder", status_code=status.HTTP_200_OK)
async def reorder_quotes(quote_orders: List[dict]):
    """
    Reorder quotes. Expects list of {id: str, order: int}
    """
    db = await get_database()

    for item in quote_orders:
        await db["vision_quotes"].update_one(
            {"_id": ObjectId(item["id"])},
            {"$set": {"order": item["order"]}}
        )

    return {"message": "Quotes reordered successfully"}


# ==================== CARDS ENDPOINTS ====================

@router.get("/cards", response_model=List[VisionCard])
async def get_cards():
    """Get all vision board cards for the user"""
    db = await get_database()
    cards = await db["vision_cards"].find({}).to_list(length=100)
    return [serialize_doc(card) for card in cards]


@router.get("/cards/{card_id}", response_model=VisionCard)
async def get_card(card_id: str):
    """Get a specific card"""
    db = await get_database()
    card = await db["vision_cards"].find_one({"_id": ObjectId(card_id)})

    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found"
        )

    return serialize_doc(card)


@router.post("/cards", response_model=VisionCard, status_code=status.HTTP_201_CREATED)
async def create_card(card: VisionCardCreate):
    """Create a new vision card"""
    db = await get_database()

    card_dict = card.model_dump()
    card_dict["createdAt"] = datetime.utcnow()
    card_dict["updatedAt"] = datetime.utcnow()
    card_dict["collapsed"] = False

    result = await db["vision_cards"].insert_one(card_dict)
    created_card = await db["vision_cards"].find_one({"_id": result.inserted_id})
    return serialize_doc(created_card)


@router.put("/cards/{card_id}", response_model=VisionCard)
async def update_card(card_id: str, card: VisionCardUpdate):
    """Update a card"""
    db = await get_database()

    update_data = {k: v for k, v in card.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    update_data["updatedAt"] = datetime.utcnow()

    result = await db["vision_cards"].update_one(
        {"_id": ObjectId(card_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found"
        )

    updated_card = await db["vision_cards"].find_one({"_id": ObjectId(card_id)})
    return serialize_doc(updated_card)


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(card_id: str):
    """Delete a card and all its goals"""
    db = await get_database()

    # Delete the card
    result = await db["vision_cards"].delete_one({"_id": ObjectId(card_id)})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found"
        )

    # Delete all goals associated with this card
    await db["vision_goals"].delete_many({"cardId": card_id})


@router.put("/cards/reorder", status_code=status.HTTP_200_OK)
async def reorder_cards(card_positions: List[dict]):
    """
    Update card positions. Expects list of {id: str, position: {x: int, y: int}}
    """
    db = await get_database()

    for item in card_positions:
        await db["vision_cards"].update_one(
            {"_id": ObjectId(item["id"])},
            {"$set": {
                "position": item["position"],
                "updatedAt": datetime.utcnow()
            }}
        )

    return {"message": "Cards reordered successfully"}


# ==================== GOALS ENDPOINTS ====================

@router.get("/cards/{card_id}/goals", response_model=List[VisionGoal])
async def get_goals_for_card(card_id: str):
    """Get all goals for a specific card"""
    db = await get_database()

    # Verify card exists
    card = await db["vision_cards"].find_one({"_id": ObjectId(card_id)})
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found"
        )

    goals = await db["vision_goals"].find({"cardId": card_id}).to_list(length=1000)
    return [serialize_doc(goal) for goal in goals]


@router.get("/goals/{goal_id}", response_model=VisionGoal)
async def get_goal(goal_id: str):
    """Get a specific goal"""
    db = await get_database()
    goal = await db["vision_goals"].find_one({"_id": ObjectId(goal_id)})

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    return serialize_doc(goal)


@router.post("/cards/{card_id}/goals", response_model=VisionGoal, status_code=status.HTTP_201_CREATED)
async def create_goal(card_id: str, goal: VisionGoalCreate):
    """Create a new goal for a card"""
    db = await get_database()

    # Verify card exists
    card = await db["vision_cards"].find_one({"_id": ObjectId(card_id)})
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found"
        )

    goal_dict = goal.model_dump()
    goal_dict["cardId"] = card_id
    goal_dict["createdAt"] = datetime.utcnow()
    goal_dict["updatedAt"] = datetime.utcnow()

    result = await db["vision_goals"].insert_one(goal_dict)
    created_goal = await db["vision_goals"].find_one({"_id": result.inserted_id})
    return serialize_doc(created_goal)


@router.put("/goals/{goal_id}", response_model=VisionGoal)
async def update_goal(goal_id: str, goal: VisionGoalUpdate):
    """Update a goal"""
    db = await get_database()

    update_data = {k: v for k, v in goal.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    update_data["updatedAt"] = datetime.utcnow()

    result = await db["vision_goals"].update_one(
        {"_id": ObjectId(goal_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    updated_goal = await db["vision_goals"].find_one({"_id": ObjectId(goal_id)})
    return serialize_doc(updated_goal)


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(goal_id: str):
    """Delete a goal"""
    db = await get_database()

    result = await db["vision_goals"].delete_one({"_id": ObjectId(goal_id)})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )


@router.put("/goals/{goal_id}/complete", response_model=VisionGoal)
async def complete_goal(goal_id: str):
    """Mark a goal as completed"""
    db = await get_database()

    result = await db["vision_goals"].update_one(
        {"_id": ObjectId(goal_id)},
        {"$set": {
            "status": "completed",
            "completedDate": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    updated_goal = await db["vision_goals"].find_one({"_id": ObjectId(goal_id)})
    return serialize_doc(updated_goal)


@router.post("/goals/{goal_id}/convert-to-subject")
async def convert_goal_to_subject(goal_id: str):
    """
    Convert a goal to a subject. This should create a new subject
    and link it to the goal. For now, just return a message.
    The actual implementation would integrate with the subjects API.
    """
    db = await get_database()

    goal = await db["vision_goals"].find_one({"_id": ObjectId(goal_id)})
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    # This would integrate with the subjects creation logic
    return {
        "message": "Goal to subject conversion endpoint",
        "goalName": goal.get("name"),
        "goalDescription": goal.get("description")
    }


@router.post("/goals/{goal_id}/convert-to-project")
async def convert_goal_to_project(goal_id: str):
    """
    Convert a goal to a project. This should create a new project
    and link it to the goal. For now, just return a message.
    The actual implementation would integrate with the projects API.
    """
    db = await get_database()

    goal = await db["vision_goals"].find_one({"_id": ObjectId(goal_id)})
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    # This would integrate with the projects creation logic
    return {
        "message": "Goal to project conversion endpoint",
        "goalName": goal.get("name"),
        "goalDescription": goal.get("description")
    }


# ==================== INITIALIZATION ====================

@router.post("/initialize", status_code=status.HTTP_201_CREATED)
async def initialize_vision_board():
    """
    Initialize the vision board with default quotes and cards.
    Only creates if none exist.
    """
    db = await get_database()

    # Check if quotes already exist
    quotes_count = await db["vision_quotes"].count_documents({})

    if quotes_count == 0:
        # Default inspirational quotes
        default_quotes = [
            {
                "quoteText": "The only way to do great work is to love what you do.",
                "author": "Steve Jobs",
                "isActive": True,
                "order": 0,
                "createdAt": datetime.utcnow()
            },
            {
                "quoteText": "Code is like humor. When you have to explain it, it's bad.",
                "author": "Cory House",
                "isActive": True,
                "order": 1,
                "createdAt": datetime.utcnow()
            },
            {
                "quoteText": "First, solve the problem. Then, write the code.",
                "author": "John Johnson",
                "isActive": True,
                "order": 2,
                "createdAt": datetime.utcnow()
            },
            {
                "quoteText": "Make it work, make it right, make it fast.",
                "author": "Kent Beck",
                "isActive": True,
                "order": 3,
                "createdAt": datetime.utcnow()
            },
            {
                "quoteText": "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
                "author": "Martin Fowler",
                "isActive": True,
                "order": 4,
                "createdAt": datetime.utcnow()
            }
        ]

        await db["vision_quotes"].insert_many(default_quotes)

    return {
        "message": "Vision board initialized successfully",
        "quotesCreated": quotes_count == 0
    }
