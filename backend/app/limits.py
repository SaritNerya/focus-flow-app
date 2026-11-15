"""הגבלות על בקשות: גודל גוף הבקשה, וקצב בקשות לפי IP (בזיכרון)."""
import ipaddress
import math
import time
from collections import deque

from fastapi import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from .config import settings
from .errors import ApiError, error_body

MAX_BODY_BYTES = 1024 * 1024  # 1MB
BODY_TOO_LARGE = "גוף הבקשה גדול מדי (עד 1MB)"


class BodySizeLimitMiddleware:
    """דוחה בקשה שגופה גדול מ-max_bytes ב-413 {"detail": ...}.

    בודק את Content-Length מראש, וגם סופר את הבתים בפועל (לבקשות chunked בלי Content-Length).
    בזמן הקריאה זורקים HTTPException: FastAPI מעביר אותה כמו שהיא, ו-errors.py מחזיר את הפורמט הנדרש.
    """

    def __init__(self, app: ASGIApp, max_bytes: int = MAX_BODY_BYTES) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        declared = dict(scope["headers"]).get(b"content-length", b"")
        if declared.isdigit() and int(declared) > self.max_bytes:
            await JSONResponse(status_code=413, content=error_body(BODY_TOO_LARGE))(scope, receive, send)
            return

        received = 0

        async def limited_receive() -> Message:
            nonlocal received
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > self.max_bytes:
                    raise StarletteHTTPException(status_code=413, detail=BODY_TOO_LARGE)
            return message

        await self.app(scope, limited_receive, send)


def client_ip(request: Request) -> str:
    """כתובת ה-IP של הלקוח, בלי לאפשר זיוף פשוט.

    כל פרוקסי מהימן (Load Balancer, ה-GFE של Cloud Run) מוסיף לסוף X-Forwarded-For את הכתובת שממנה
    קיבל את הבקשה. לכן הלקוח הוא הכתובת ה-trusted_proxy_hops מהסוף. מה שלפניה הלקוח יכול לכתוב בעצמו
    ולכן לא נקרא. ב-0 (חיבור ישיר) הכותרת לא נקראת בכלל.
    """
    peer = request.client.host if request.client else "unknown"
    hops = settings.trusted_proxy_hops
    if hops <= 0:
        return peer
    chain = [p.strip() for p in ",".join(request.headers.getlist("x-forwarded-for")).split(",") if p.strip()]
    if len(chain) < hops:
        return peer  # הבקשה לא עברה דרך כל הפרוקסים המצופים — לא סומכים על הכותרת
    candidate = chain[-hops]
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return peer


class RateLimiter:
    """חלון נע בזיכרון: עד limit בקשות לכל מפתח ב-window שניות.
    הערה: בכמה מופעים של השרת (למשל Cloud Run) כל מופע סופר בנפרד."""

    def __init__(self, limit: int, window: float = 60.0, max_keys: int = 10_000) -> None:
        self.limit = limit
        self.window = window
        self.max_keys = max_keys
        self._hits: dict[str, deque[float]] = {}

    def hit(self, key: str) -> float | None:
        """רושם בקשה. מחזיר None אם מותר, או כמה שניות לחכות אם המכסה מלאה."""
        now = time.monotonic()
        hits = self._hits.get(key)
        if hits is None:
            if len(self._hits) >= self.max_keys:
                self._evict(now)
            hits = self._hits[key] = deque()
        while hits and now - hits[0] >= self.window:
            hits.popleft()
        if len(hits) >= self.limit:
            return self.window - (now - hits[0])
        hits.append(now)
        return None

    def _evict(self, now: float) -> None:
        """שומר על זיכרון חסום: מוחק מפתחות שפג תוקפם, ואם עדיין מלא — את הישן ביותר."""
        for key in [k for k, h in self._hits.items() if not h or now - h[-1] >= self.window]:
            del self._hits[key]
        while len(self._hits) >= self.max_keys:
            del self._hits[next(iter(self._hits))]

    def reset(self) -> None:
        self._hits.clear()


auth_limiter = RateLimiter(settings.rate_limit_per_minute)


def rate_limited(route: str):
    """Dependency: הגבלת קצב לפי IP לנתיב מסוים (מונה נפרד לכל נתיב)."""

    async def check(request: Request) -> None:
        retry_after = auth_limiter.hit(f"{route}:{client_ip(request)}")
        if retry_after is not None:
            raise ApiError(429, "יותר מדי בקשות מהכתובת הזו. נסו שוב בעוד דקה",
                           headers={"Retry-After": str(math.ceil(retry_after))})

    return check
