from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import db
from .config import settings
from .errors import install_handlers
from .limits import BodySizeLimitMiddleware
from .routes import auth, content, sessions, users


@asynccontextmanager
async def lifespan(_: FastAPI):
    await db.connect()
    yield
    await db.close()


SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}

app = FastAPI(title="FocusFlow API", version="1.0.0", lifespan=lifespan)
# קודם ההגבלה ואחריה CORS: ה-middleware האחרון שנוסף עוטף את כולם, כך שגם תשובת 413 מקבלת כותרות CORS
app.add_middleware(BodySizeLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_methods=["*"],
    allow_headers=["*"],  # הטוקן נשלח בכותרת Authorization, לא בעוגיות
)
install_handlers(app)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """כותרות אבטחה על כל תשובה (גם שגיאות). נוסף אחרון — ולכן עוטף את כל השאר."""
    response = await call_next(request)
    for name, value in SECURITY_HEADERS.items():
        response.headers.setdefault(name, value)
    return response


@app.get("/health")
async def health():
    try:
        await db.get_db().command("ping")
    except Exception:
        return JSONResponse(status_code=503, content={"status": "db_unavailable"})
    return {"status": "ok"}


for r in (auth.router, users.router, content.router, sessions.router):
    app.include_router(r)
