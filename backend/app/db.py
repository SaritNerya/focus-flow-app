from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from .config import settings
from .errors import ApiError

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def ensure_indexes(db) -> None:
    await db.users.create_index("email", unique=True)  # האימייל נשמר באותיות קטנות
    await db.content.create_index([("owner_id", 1), ("created_at", -1)])
    await db.sessions.create_index([("user_id", 1), ("started_at", -1)])
    # מסמכים שנמחקים אוטומטית בפקיעת expire_at
    await db.revoked_tokens.create_index("expire_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("expire_at", expireAfterSeconds=0)


async def connect() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(settings.mongo_url, tz_aware=True, serverSelectionTimeoutMS=5000)
    _db = _client[settings.mongo_db]
    await ensure_indexes(_db)


async def close() -> None:
    if _client:
        _client.close()


def get_db() -> AsyncIOMotorDatabase:
    assert _db is not None, "DB not connected"
    return _db


def now() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def oid_or_404(value: str, what: str = "הפריט") -> ObjectId:
    """מזהה לא תקין = 'לא נמצא', בלי לחשוף מידע."""
    try:
        return ObjectId(value)
    except Exception:
        raise ApiError(404, f"{what} לא נמצא")
