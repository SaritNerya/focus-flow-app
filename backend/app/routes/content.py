from fastapi import APIRouter, Depends, Response

from .. import db
from ..content_service import prepare_content
from ..deps import current_user
from ..errors import ApiError
from ..schemas import ContentIn, ContentOut

router = APIRouter(prefix="/api/content", tags=["content"])
LIST_PREVIEW = 200


def to_out(doc: dict, full: bool) -> ContentOut:
    source = doc["source"]
    if not full and doc["type"] == "text" and len(source) > LIST_PREVIEW:
        source = source[:LIST_PREVIEW] + "…"  # ברשימה לא שולחים טקסטים ארוכים
    return ContentOut(
        id=str(doc["_id"]),
        title=doc["title"],
        type=doc["type"],
        source=source,
        created_at=db.as_utc(doc["created_at"]),
        text=doc.get("text") if full else None,
        youtube_id=doc.get("youtube_id"),
    )


async def get_owned(content_id: str, user: dict) -> dict:
    """שליפה תמיד עם owner_id מהטוקן. פריט של אחר = 404, כאילו לא קיים."""
    oid = db.oid_or_404(content_id)
    doc = await db.get_db().content.find_one({"_id": oid, "owner_id": user["_id"]})
    if not doc:
        raise ApiError(404, "הפריט לא נמצא")
    return doc


@router.post("", response_model=ContentOut, status_code=201)
async def create_content(body: ContentIn, user: dict = Depends(current_user)):
    fields = await prepare_content(body)
    doc = {**fields, "owner_id": user["_id"], "created_at": db.now()}
    res = await db.get_db().content.insert_one(doc)
    doc["_id"] = res.inserted_id
    return to_out(doc, full=False)


@router.get("", response_model=list[ContentOut])
async def list_content(user: dict = Depends(current_user)):
    cursor = db.get_db().content.find({"owner_id": user["_id"]}, {"text": 0}).sort("created_at", -1)
    return [to_out(d, full=False) async for d in cursor]


@router.get("/{content_id}", response_model=ContentOut)
async def get_content(content_id: str, user: dict = Depends(current_user)):
    return to_out(await get_owned(content_id, user), full=True)


@router.delete("/{content_id}", status_code=204, response_class=Response)
async def delete_content(content_id: str, user: dict = Depends(current_user)):
    doc = await get_owned(content_id, user)
    await db.get_db().content.delete_one({"_id": doc["_id"], "owner_id": user["_id"]})
    # הסשנים נשארים בהיסטוריה (הכותרת נשמרה בהם)
    return Response(status_code=204)
