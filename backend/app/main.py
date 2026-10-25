from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import db
from .config import settings
from .errors import install_handlers
from .routes import auth, content, sessions, users


@asynccontextmanager
async def lifespan(_: FastAPI):
    await db.connect()
    yield
    await db.close()


app = FastAPI(title="FocusFlow API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_methods=["*"],
    allow_headers=["*"],  # הטוקן נשלח בכותרת Authorization, לא בעוגיות
)
install_handlers(app)


@app.get("/health")
async def health():
    try:
        await db.get_db().command("ping")
    except Exception:
        return JSONResponse(status_code=503, content={"status": "db_unavailable"})
    return {"status": "ok"}


for r in (auth.router, users.router, content.router, sessions.router):
    app.include_router(r)
