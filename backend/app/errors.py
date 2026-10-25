from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class ApiError(Exception):
    """שגיאה בפורמט הנדרש: {"message": "..."} (+ fields אופציונלי לשדות בטופס)."""

    def __init__(self, status: int, message: str, fields: dict[str, str] | None = None):
        self.status = status
        self.message = message
        self.fields = fields or {}


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
    if t == "json_invalid":
        return "גוף הבקשה אינו JSON תקין"
    if t.endswith("_type") or t.endswith("_parsing"):
        return "סוג הערך אינו תקין"
    return "ערך לא תקין"


def install_handlers(app) -> None:
    @app.exception_handler(ApiError)
    async def api_error(_: Request, exc: ApiError):
        body = {"message": exc.message}
        if exc.fields:
            body["fields"] = exc.fields
        headers = {"WWW-Authenticate": "Bearer"} if exc.status == 401 else None
        return JSONResponse(status_code=exc.status, content=body, headers=headers)

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, exc: StarletteHTTPException):
        msg = "הנתיב לא נמצא" if exc.status_code == 404 else str(exc.detail)
        return JSONResponse(status_code=exc.status_code, content={"message": msg})

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError):
        fields: dict[str, str] = {}
        for err in exc.errors():
            loc = [str(p) for p in err["loc"] if p not in ("body", "query", "path")]
            fields.setdefault(".".join(loc) or "body", _translate(err))
        first = next(iter(fields.values()), "קלט לא תקין")
        return JSONResponse(status_code=422, content={"message": first, "fields": fields})
