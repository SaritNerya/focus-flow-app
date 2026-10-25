import jwt
from bson import ObjectId
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import db
from .errors import ApiError
from .security import decode_token

_bearer = HTTPBearer(auto_error=False)


async def current_user(creds: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> dict:
    """מזהה את המשתמש לפי הטוקן בלבד (לעולם לא לפי גוף הבקשה)."""
    if creds is None:
        raise ApiError(401, "יש להתחבר כדי להמשיך")
    try:
        payload = decode_token(creds.credentials)
        user_id = ObjectId(payload["sub"])
    except (jwt.PyJWTError, Exception):
        raise ApiError(401, "ההתחברות לא תקינה או שפג תוקפה. יש להתחבר מחדש")

    database = db.get_db()
    if await database.revoked_tokens.find_one({"_id": payload["jti"]}):
        raise ApiError(401, "ההתחברות בוטלה. יש להתחבר מחדש")
    user = await database.users.find_one({"_id": user_id})
    if not user or user.get("token_version", 0) != payload.get("tv", 0):
        raise ApiError(401, "ההתחברות לא תקינה. יש להתחבר מחדש")
    user["_jti"] = payload["jti"]
    user["_exp"] = payload["exp"]
    return user
