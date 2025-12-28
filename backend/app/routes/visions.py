from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime
import secrets

from app.core.database import get_database
from app.models.vision import (
    Vision,
    VisionCard,
    VisionGoal,
    VisionQuote,
    VisionCardCreate,
    VisionCardUpdate,
    VisionGoalCreate,
    VisionGoalUpdate,
    VisionQuoteCreate,
    VisionQuoteUpdate,
)

router = APIRouter()


def generate_id(prefix: str) -> str:
    """Generate a unique ID with a prefix"""
    return f"{prefix}_{secrets.token_urlsafe(8)}"


VISION_BOARD_ID = "main"


async def get_or_create_vision_doc():
    """Get the vision document or create if doesn't exist"""
    db = await get_database()
    vision = await db["visions"].find_one({"visionBoardId": VISION_BOARD_ID})

    if not vision:
        # Create new vision document
        vision_data = {
            "visionBoardId": VISION_BOARD_ID,
            "cards": [],
            "quotes": [],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        await db["visions"].insert_one(vision_data)
        vision = await db["visions"].find_one({"visionBoardId": VISION_BOARD_ID})

    # Remove MongoDB's _id from response
    if vision and "_id" in vision:
        del vision["_id"]

    return vision


# ==================== CARDS ENDPOINTS ====================

@router.get("/cards")
async def get_all_cards():
    """Get all vision cards"""
    vision = await get_or_create_vision_doc()
    return vision.get("cards", [])


@router.get("/cards/{card_id}")
async def get_card(card_id: str):
    """Get a specific card by ID"""
    vision = await get_or_create_vision_doc()
    card = next((c for c in vision.get("cards", []) if c["cardId"] == card_id), None)

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    return card


@router.post("/cards", status_code=status.HTTP_201_CREATED)
async def create_card(card: VisionCardCreate):
    """Create a new vision card"""
    db = await get_database()
    vision = await get_or_create_vision_doc()

    # Create new card
    new_card = {
        "cardId": generate_id("card"),
        "title": card.title,
        "type": card.type,
        "size": card.size,
        "colorCode": card.colorCode,
        "position": card.position.model_dump(),
        "collapsed": False,
        "goals": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    # Add to cards array
    await db["visions"].update_one(
        {"visionBoardId": VISION_BOARD_ID},
        {
            "$push": {"cards": new_card},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )

    return new_card


@router.put("/cards/{card_id}")
async def update_card(card_id: str, card_update: VisionCardUpdate):
    """Update a card"""
    db = await get_database()
    vision = await get_or_create_vision_doc()

    # Find card index
    card_index = next(
        (i for i, c in enumerate(vision.get("cards", [])) if c["cardId"] == card_id),
        None
    )

    if card_index is None:
        raise HTTPException(status_code=404, detail="Card not found")

    # Build update dict
    update_fields = {}
    if card_update.title is not None:
        update_fields[f"cards.{card_index}.title"] = card_update.title
    if card_update.size is not None:
        update_fields[f"cards.{card_index}.size"] = card_update.size
    if card_update.colorCode is not None:
        update_fields[f"cards.{card_index}.colorCode"] = card_update.colorCode
    if card_update.position is not None:
        update_fields[f"cards.{card_index}.position"] = card_update.position.model_dump()
    if card_update.collapsed is not None:
        update_fields[f"cards.{card_index}.collapsed"] = card_update.collapsed

    update_fields[f"cards.{card_index}.updatedAt"] = datetime.utcnow()
    update_fields["updatedAt"] = datetime.utcnow()

    await db["visions"].update_one(
        {"visionBoardId": VISION_BOARD_ID},
        {"$set": update_fields}
    )

    # Return updated card
    updated_vision = await get_or_create_vision_doc()
    return updated_vision["cards"][card_index]


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(card_id: str):
    """Delete a card"""
    db = await get_database()
    vision = await get_or_create_vision_doc()

    # Check if card exists
    card_exists = any(c["cardId"] == card_id for c in vision.get("cards", []))
    if not card_exists:
        raise HTTPException(status_code=404, detail="Card not found")

    # Remove card from array
    await db["visions"].update_one(
        {"visionBoardId": VISION_BOARD_ID},
        {
            "$pull": {"cards": {"cardId": card_id}},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )


# ==================== GOALS ENDPOINTS ====================

@router.get("/cards/{card_id}/goals")
async def get_card_goals(card_id: str):
    """Get all goals for a card"""
    vision = await get_or_create_vision_doc()
    card = next((c for c in vision.get("cards", []) if c["cardId"] == card_id), None)

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    return card.get("goals", [])


@router.post("/cards/{card_id}/goals", status_code=status.HTTP_201_CREATED)
async def create_goal(card_id: str, goal: VisionGoalCreate):
    """Create a new goal for a card"""
    db = await get_database()
    vision = await get_or_create_vision_doc()

    # Find card index
    card_index = next(
        (i for i, c in enumerate(vision.get("cards", [])) if c["cardId"] == card_id),
        None
    )

    if card_index is None:
        raise HTTPException(status_code=404, detail="Card not found")

    # Create new goal
    new_goal = {
        "goalId": generate_id("goal"),
        "name": goal.name,
        "description": goal.description,
        "status": goal.status,
        "priority": goal.priority,
        "linkedProjectId": goal.linkedProjectId,
        "linkedSubjectId": goal.linkedSubjectId,
        "createdAt": datetime.utcnow(),
        "completedAt": None,
    }

    # Add goal to card
    await db["visions"].update_one(
        {"visionBoardId": VISION_BOARD_ID},
        {
            "$push": {f"cards.{card_index}.goals": new_goal},
            "$set": {
                f"cards.{card_index}.updatedAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        }
    )

    return new_goal


@router.put("/goals/{goal_id}")
async def update_goal(goal_id: str, goal_update: VisionGoalUpdate):
    """Update a goal"""
    db = await get_database()
    vision = await get_or_create_vision_doc()

    # Find card and goal indices
    card_index = None
    goal_index = None

    for c_idx, card in enumerate(vision.get("cards", [])):
        for g_idx, goal in enumerate(card.get("goals", [])):
            if goal["goalId"] == goal_id:
                card_index = c_idx
                goal_index = g_idx
                break
        if card_index is not None:
            break

    if card_index is None or goal_index is None:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Build update dict
    update_fields = {}
    if goal_update.name is not None:
        update_fields[f"cards.{card_index}.goals.{goal_index}.name"] = goal_update.name
    if goal_update.description is not None:
        update_fields[f"cards.{card_index}.goals.{goal_index}.description"] = goal_update.description
    if goal_update.status is not None:
        update_fields[f"cards.{card_index}.goals.{goal_index}.status"] = goal_update.status
        if goal_update.status == "completed":
            update_fields[f"cards.{card_index}.goals.{goal_index}.completedAt"] = datetime.utcnow()
    if goal_update.priority is not None:
        update_fields[f"cards.{card_index}.goals.{goal_index}.priority"] = goal_update.priority
    if goal_update.linkedProjectId is not None:
        update_fields[f"cards.{card_index}.goals.{goal_index}.linkedProjectId"] = goal_update.linkedProjectId
    if goal_update.linkedSubjectId is not None:
        update_fields[f"cards.{card_index}.goals.{goal_index}.linkedSubjectId"] = goal_update.linkedSubjectId

    update_fields[f"cards.{card_index}.updatedAt"] = datetime.utcnow()
    update_fields["updatedAt"] = datetime.utcnow()

    await db["visions"].update_one(
        {"visionBoardId": VISION_BOARD_ID},
        {"$set": update_fields}
    )

    # Return updated goal
    updated_vision = await get_or_create_vision_doc()
    return updated_vision["cards"][card_index]["goals"][goal_index]


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(goal_id: str):
    """Delete a goal"""
    db = await get_database()
    vision = await get_or_create_vision_doc()

    # Find card containing the goal
    card_index = None
    for c_idx, card in enumerate(vision.get("cards", [])):
        if any(g["goalId"] == goal_id for g in card.get("goals", [])):
            card_index = c_idx
            break

    if card_index is None:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Remove goal from card
    await db["visions"].update_one(
        {"visionBoardId": VISION_BOARD_ID},
        {
            "$pull": {f"cards.{card_index}.goals": {"goalId": goal_id}},
            "$set": {
                f"cards.{card_index}.updatedAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        }
    )


@router.put("/goals/{goal_id}/complete")
async def complete_goal(goal_id: str):
    """Mark a goal as complete"""
    goal_update = VisionGoalUpdate(status="completed")
    return await update_goal(goal_id, goal_update)


# ==================== QUOTES ENDPOINTS ====================

@router.get("/quotes")
async def get_quotes():
    """Get active quotes"""
    vision = await get_or_create_vision_doc()
    quotes = vision.get("quotes", [])
    return [q for q in quotes if q.get("isActive", True)]


@router.get("/quotes/all")
async def get_all_quotes():
    """Get all quotes including inactive ones"""
    vision = await get_or_create_vision_doc()
    return vision.get("quotes", [])


@router.post("/quotes", status_code=status.HTTP_201_CREATED)
async def create_quote(quote: VisionQuoteCreate):
    """Create a new quote"""
    db = await get_database()
    vision = await get_or_create_vision_doc()

    # Check quote limit
    if len(vision.get("quotes", [])) >= 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum of 15 quotes allowed"
        )

    # Create new quote
    new_quote = {
        "quoteId": generate_id("quote"),
        "quoteText": quote.quoteText,
        "author": quote.author,
        "isActive": quote.isActive,
        "order": quote.order,
    }

    # Add to quotes array
    await db["visions"].update_one(
        {"visionBoardId": VISION_BOARD_ID},
        {
            "$push": {"quotes": new_quote},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )

    return new_quote


@router.put("/quotes/{quote_id}")
async def update_quote(quote_id: str, quote_update: VisionQuoteUpdate):
    """Update a quote"""
    db = await get_database()
    vision = await get_or_create_vision_doc()

    # Find quote index
    quote_index = next(
        (i for i, q in enumerate(vision.get("quotes", [])) if q["quoteId"] == quote_id),
        None
    )

    if quote_index is None:
        raise HTTPException(status_code=404, detail="Quote not found")

    # Build update dict
    update_fields = {}
    if quote_update.quoteText is not None:
        update_fields[f"quotes.{quote_index}.quoteText"] = quote_update.quoteText
    if quote_update.author is not None:
        update_fields[f"quotes.{quote_index}.author"] = quote_update.author
    if quote_update.isActive is not None:
        update_fields[f"quotes.{quote_index}.isActive"] = quote_update.isActive
    if quote_update.order is not None:
        update_fields[f"quotes.{quote_index}.order"] = quote_update.order

    update_fields["updatedAt"] = datetime.utcnow()

    await db["visions"].update_one(
        {"visionBoardId": VISION_BOARD_ID},
        {"$set": update_fields}
    )

    # Return updated quote
    updated_vision = await get_or_create_vision_doc()
    return updated_vision["quotes"][quote_index]


@router.delete("/quotes/{quote_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quote(quote_id: str):
    """Delete a quote"""
    db = await get_database()
    vision = await get_or_create_vision_doc()

    # Check if this is the last active quote
    active_quotes = [q for q in vision.get("quotes", []) if q.get("isActive", True)]
    quote_to_delete = next((q for q in vision.get("quotes", []) if q["quoteId"] == quote_id), None)

    if quote_to_delete and quote_to_delete.get("isActive") and len(active_quotes) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the last active quote"
        )

    # Remove quote from array
    await db["visions"].update_one(
        {"visionBoardId": VISION_BOARD_ID},
        {
            "$pull": {"quotes": {"quoteId": quote_id}},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )


@router.put("/quotes/reorder", status_code=status.HTTP_200_OK)
async def reorder_quotes(quote_orders: List[dict]):
    """Reorder quotes. Expects list of {quoteId: str, order: int}"""
    db = await get_database()
    vision = await get_or_create_vision_doc()

    # Update order for each quote
    for item in quote_orders:
        quote_id = item.get("quoteId") or item.get("id")
        order = item.get("order")

        if quote_id and order is not None:
            # Find quote index
            quote_index = next(
                (i for i, q in enumerate(vision.get("quotes", [])) if q["quoteId"] == quote_id),
                None
            )

            if quote_index is not None:
                await db["visions"].update_one(
                    {"visionBoardId": VISION_BOARD_ID},
                    {"$set": {f"quotes.{quote_index}.order": order}}
                )

    await db["visions"].update_one(
        {"visionBoardId": VISION_BOARD_ID},
        {"$set": {"updatedAt": datetime.utcnow()}}
    )

    return {"message": "Quotes reordered successfully"}


# ==================== INITIALIZATION ====================

@router.post("/initialize")
async def initialize_vision_board():
    """Initialize the vision board with default quotes"""
    db = await get_database()
    vision = await db["visions"].find_one({"visionBoardId": VISION_BOARD_ID})

    # Only initialize if no vision document exists
    if vision:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vision board already initialized"
        )

    # Create with default quotes
    default_quotes = [
        {
            "quoteId": generate_id("quote"),
            "quoteText": "The only way to do great work is to love what you do.",
            "author": "Steve Jobs",
            "isActive": True,
            "order": 0,
        },
        {
            "quoteId": generate_id("quote"),
            "quoteText": "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "author": "Winston Churchill",
            "isActive": True,
            "order": 1,
        },
        {
            "quoteId": generate_id("quote"),
            "quoteText": "Believe you can and you're halfway there.",
            "author": "Theodore Roosevelt",
            "isActive": True,
            "order": 2,
        },
    ]

    vision_data = {
        "visionBoardId": VISION_BOARD_ID,
        "cards": [],
        "quotes": default_quotes,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    await db["visions"].insert_one(vision_data)

    return {"message": "Vision board initialized successfully"}
