from fastapi import APIRouter, Depends

from .. import db
from ..deps import current_user
from ..errors import ApiError
from ..routes.content import get_owned
from ..schemas import ReadingIn, ReadingOut, SessionCreate, SessionDetail, SessionStart, SessionSummary

router = APIRouter(prefix="/api/sessions", tags=["sessions"])
MAX_READINGS = 5000


def _avg(doc: dict) -> float | None:
    n = doc.get("reading_count", 0)
    return round(doc.get("score_sum", 0.0) / n, 4) if n else None


def to_summary(doc: dict) -> dict:
    return dict(
        id=str(doc["_id"]),
        content_id=str(doc["content_id"]),
        content_title=doc.get("content_title"),
        content_type=doc.get("content_type"),
        started_at=db.as_utc(doc["started_at"]),
        ended_at=db.as_utc(doc.get("ended_at")),
        reading_count=doc.get("reading_count", 0),
        average_score=_avg(doc),
    )


async def get_owned_session(session_id: str, user: dict, projection: dict | None = None) -> dict:
    oid = db.oid_or_404(session_id, "הסשן")
    doc = await db.get_db().sessions.find_one({"_id": oid, "user_id": user["_id"]}, projection)
    if not doc:
        raise ApiError(404, "הסשן לא נמצא")
    return doc


@router.post("", response_model=SessionStart, status_code=201)
async def start_session(body: SessionCreate, user: dict = Depends(current_user)):
    content = await get_owned(body.content_id, user)  # 404 אם לא שלי
    doc = {
        "user_id": user["_id"],
        "content_id": content["_id"],
        "content_title": content["title"],
        "content_type": content["type"],
        "started_at": db.now(),
        "ended_at": None,
        "readings": [],
        "reading_count": 0,
        "score_sum": 0.0,
    }
    res = await db.get_db().sessions.insert_one(doc)
    return SessionStart(id=str(res.inserted_id), content_id=str(content["_id"]), started_at=db.as_utc(doc["started_at"]))


@router.post("/{session_id}/readings", status_code=201, response_model=ReadingOut)
async def add_reading(session_id: str, body: ReadingIn, user: dict = Depends(current_user)):
    session = await get_owned_session(session_id, user, {"ended_at": 1})
    if session.get("ended_at"):
        raise ApiError(409, "הסשן כבר נסגר")
    reading = {"position": body.position, "score": body.score, "created_at": db.now()}
    res = await db.get_db().sessions.update_one(
        {"_id": session["_id"], "user_id": user["_id"], "ended_at": None, f"readings.{MAX_READINGS - 1}": {"$exists": False}},
        {"$push": {"readings": reading}, "$inc": {"reading_count": 1, "score_sum": body.score}},
    )
    if res.matched_count == 0:
        raise ApiError(409, "הסשן נסגר או הגיע למספר המדידות המרבי")
    return ReadingOut(**{**reading, "created_at": db.as_utc(reading["created_at"])})


@router.post("/{session_id}/end", response_model=SessionSummary)
async def end_session(session_id: str, user: dict = Depends(current_user)):
    await get_owned_session(session_id, user, {"_id": 1})
    coll = db.get_db().sessions
    await coll.update_one({"_id": db.oid_or_404(session_id), "user_id": user["_id"], "ended_at": None}, {"$set": {"ended_at": db.now()}})
    doc = await get_owned_session(session_id, user, {"readings": 0})
    return SessionSummary(**to_summary(doc))


@router.get("", response_model=list[SessionSummary])
async def list_sessions(user: dict = Depends(current_user)):
    cursor = db.get_db().sessions.find({"user_id": user["_id"]}, {"readings": 0}).sort("started_at", -1)
    return [SessionSummary(**to_summary(d)) async for d in cursor]


@router.get("/{session_id}", response_model=SessionDetail)
async def get_session(session_id: str, user: dict = Depends(current_user)):
    doc = await get_owned_session(session_id, user)
    readings = [ReadingOut(position=r["position"], score=r["score"], created_at=db.as_utc(r["created_at"])) for r in doc.get("readings", [])]
    return SessionDetail(**to_summary(doc), readings=readings)
