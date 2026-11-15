from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

# רק בשגיאות האלה מצרפים הודעה לכל שדה בטופס (fields)
FIELD_STATUSES = (409, 422)


class ApiError(Exception):
    """שגיאה בפורמט הנדרש: {"detail": "..."} (+ fields לשדות בטופס, ב-409 וב-422 בלבד)."""

    def __init__(self, status: int, message: str, fields: dict[str, str] | None = None, headers: dict[str, str] | None = None):
        self.status = status
        self.message = message
        self.fields = fields or {}
        self.headers = headers or {}


def error_body(message: str, fields: dict[str, str] | None = None) -> dict:
    body: dict = {"detail": message}
    if fields:
        body["fields"] = fields
    return body


def _translate(err: dict) -> str:
    t = err.get("type", "")
    if t == "missing":
        return "שדה חובה"
    if t == "value_error":
        return err.get("msg", "").removeprefix("Value error, ") or "ערך לא תקין"
    if t.startswith("string_too_short"):
        return "הטקסט קצר מדי"
    if t.startswith("string_too_long"):
        return "הטקסט ארוך מדי"
    if t in ("greater_than_equal", "less_than_equal", "greater_than", "less_than"):
        return "הערך מחוץ לטווח המותר"
    if t.endswith("_type") or t.endswith("_parsing"):
        return "סוג הערך אינו תקין"
    return "ערך לא תקין"


def install_handlers(app) -> None:
    @app.exception_handler(ApiError)
    async def api_error(_: Request, exc: ApiError):
        fields = exc.fields if exc.status in FIELD_STATUSES else None
        headers = {**exc.headers, **({"WWW-Authenticate": "Bearer"} if exc.status == 401 else {})}
        return JSONResponse(status_code=exc.status, content=error_body(exc.message, fields), headers=headers or None)

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, exc: StarletteHTTPException):
        msg = "הנתיב לא נמצא" if exc.status_code == 404 else str(exc.detail)
        return JSONResponse(status_code=exc.status_code, content=error_body(msg))

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError):
        errors = exc.errors()
        if any(err.get("type") == "json_invalid" for err in errors):
            return JSONResponse(status_code=422, content=error_body("גוף הבקשה אינו JSON תקין"))
        fields: dict[str, str] = {}
        for err in errors:
            loc = [str(p) for p in err["loc"] if p not in ("body", "query", "path")]
            fields.setdefault(".".join(loc) or "body", _translate(err))
        first = next(iter(fields.values()), "קלט לא תקין")
        return JSONResponse(status_code=422, content=error_body(first, fields))
