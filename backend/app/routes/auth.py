from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Response
from pymongo.errors import DuplicateKeyError

from .. import db
from ..config import settings
from ..deps import current_user
from ..errors import ApiError
from ..schemas import LoginIn, RegisterIn, RegisterOut, TokenOut
from ..security import create_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=RegisterOut, status_code=201)
async def register(body: RegisterIn):
    database = db.get_db()
    if await database.users.find_one({"email": body.email}):
        raise ApiError(409, "האימייל הזה כבר רשום. נסו להתחבר", {"email": "האימייל הזה כבר רשום"})
    doc = {
        "email": body.email,  # כבר באותיות קטנות
        "password_hash": await hash_password(body.password),
        "display_name": body.display_name,
        "created_at": db.now(),
        "token_version": 0,
    }
    try:
        res = await database.users.insert_one(doc)
    except DuplicateKeyError:  # מרוץ בין שתי הרשמות במקביל
        raise ApiError(409, "האימייל הזה כבר רשום. נסו להתחבר", {"email": "האימייל הזה כבר רשום"})
    return RegisterOut(id=str(res.inserted_id), email=doc["email"], display_name=doc["display_name"])


async def _check_lock(email: str) -> None:
    rec = await db.get_db().login_attempts.find_one({"_id": email})
    locked = db.as_utc(rec.get("locked_until")) if rec else None
    if locked and locked > db.now():
        minutes = max(1, int((locked - db.now()).total_seconds() // 60) + 1)
        raise ApiError(429, f"יותר מדי ניסיונות כושלים. נסו שוב בעוד כ-{minutes} דקות")


async def _register_failure(email: str) -> None:
    coll = db.get_db().login_attempts
    window = timedelta(minutes=settings.lockout_minutes)
    rec = await coll.find_one_and_update(
        {"_id": email},
        {"$inc": {"count": 1}, "$set": {"expire_at": db.now() + window}},
        upsert=True,
        return_document=True,
    )
    if rec["count"] >= settings.max_login_attempts:
        until = db.now() + window
        await coll.update_one({"_id": email}, {"$set": {"locked_until": until, "expire_at": until, "count": 0}})


@router.post("/login", response_model=TokenOut)
async def login(body: LoginIn):
    database = db.get_db()
    await _check_lock(body.email)
    user = await database.users.find_one({"email": body.email})
    ok = await verify_password(body.password, user["password_hash"] if user else None)
    if not user or not ok:
        await _register_failure(body.email)
        raise ApiError(401, "האימייל או הסיסמה שגויים")
    await database.login_attempts.delete_one({"_id": body.email})
    token, expires_in = create_token(str(user["_id"]), user.get("token_version", 0))
    return TokenOut(access_token=token, expires_in=expires_in)


@router.post("/logout", status_code=204, response_class=Response)
async def logout(user: dict = Depends(current_user)):
    """מבטל את הטוקן הנוכחי (רשימת ביטולים עם TTL), כך שהוא לא יעבוד יותר."""
    await db.get_db().revoked_tokens.update_one(
        {"_id": user["_jti"]},
        {"$set": {"expire_at": datetime.fromtimestamp(user["_exp"], tz=timezone.utc)}},
        upsert=True,
    )
    return Response(status_code=204)
