import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from starlette.concurrency import run_in_threadpool

from .config import settings

ALGORITHM = "HS256"
# hash דמה: כדי שזמן התגובה בהתחברות לא יחשוף אם האימייל קיים
_DUMMY_HASH = bcrypt.hashpw(b"dummy-password", bcrypt.gensalt(rounds=12))


async def hash_password(password: str) -> str:
    raw = password.encode("utf-8")
    return (await run_in_threadpool(bcrypt.hashpw, raw, bcrypt.gensalt(rounds=12))).decode()


async def verify_password(password: str, hashed: str | None) -> bool:
    target = hashed.encode() if hashed else _DUMMY_HASH
    ok = await run_in_threadpool(bcrypt.checkpw, password.encode("utf-8")[:72], target)
    return ok and hashed is not None


def create_token(user_id: str, token_version: int) -> tuple[str, int]:
    expires = timedelta(minutes=settings.jwt_expire_minutes)
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "jti": uuid.uuid4().hex,
        "tv": token_version,  # עולה בכל החלפת סיסמה ופוסל טוקנים ישנים
        "iat": now,
        "exp": now + expires,
    }
    return jwt.encode(payload, settings.secret_jwt, algorithm=ALGORITHM), int(expires.total_seconds())


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_jwt, algorithms=[ALGORITHM], options={"require": ["exp", "sub", "jti"]})
