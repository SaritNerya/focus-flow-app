import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from .config import settings

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def clean_email(v: str) -> str:
    v = v.strip().lower()
    if len(v) > 254 or not EMAIL_RE.match(v):
        raise ValueError("כתובת האימייל לא תקינה")
    return v


def check_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("הסיסמה קצרה מדי: נדרשים לפחות 8 תווים")
    if len(v.encode("utf-8")) > 72:
        raise ValueError("הסיסמה ארוכה מדי (עד 72 בתים)")
    if settings.password_require_mixed and not (re.search(r"[A-Za-z]", v) and re.search(r"\d", v)):
        raise ValueError("הסיסמה חייבת לכלול לפחות אות אחת וספרה אחת")
    return v


def clean_name(v: str) -> str:
    v = v.strip()
    if not 1 <= len(v) <= 50:
        raise ValueError("שם התצוגה חייב להכיל בין 1 ל-50 תווים")
    return v


# ---------- auth / users ----------
class RegisterIn(BaseModel):
    email: str
    password: str
    display_name: str

    _e = field_validator("email")(clean_email)
    _p = field_validator("password")(check_password)
    _n = field_validator("display_name")(clean_name)


class LoginIn(BaseModel):
    email: str
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def _norm(cls, v: str) -> str:
        return v.strip().lower()


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str
    created_at: datetime


class RegisterOut(BaseModel):
    id: str
    email: str
    display_name: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserUpdate(BaseModel):
    display_name: str
    _n = field_validator("display_name")(clean_name)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str
    _p = field_validator("new_password")(check_password)


# ---------- content ----------
ContentType = Literal["youtube", "text", "web"]


class ContentIn(BaseModel):
    type: str
    title: str
    source: str

    @field_validator("title")
    @classmethod
    def _title(cls, v: str) -> str:
        v = v.strip()
        if not 1 <= len(v) <= 120:
            raise ValueError("הכותרת חייבת להכיל בין 1 ל-120 תווים")
        return v


class ContentOut(BaseModel):
    id: str
    title: str
    type: str
    source: str
    created_at: datetime
    text: str | None = None        # בפריט בודד: הטקסט להצגה (text / web)
    youtube_id: str | None = None  # בפריט מסוג youtube


# ---------- sessions ----------
class SessionCreate(BaseModel):
    content_id: str


class ReadingIn(BaseModel):
    position: float = Field(ge=0, allow_inf_nan=False)   # שניות בסרטון / מיקום בטקסט (0..1 או אינדקס)
    score: float = Field(ge=0, le=1, allow_inf_nan=False)


class ReadingOut(BaseModel):
    position: float
    score: float
    created_at: datetime


class SessionStart(BaseModel):
    id: str
    content_id: str
    started_at: datetime


class SessionSummary(BaseModel):
    id: str
    content_id: str
    content_title: str | None = None
    content_type: str | None = None
    started_at: datetime
    ended_at: datetime | None = None
    reading_count: int
    average_score: float | None = None


class SessionDetail(SessionSummary):
    readings: list[ReadingOut]
