"""אימות טוקן הזדהות (ID token) ש-Google הנפיקה לדפדפן.

הדפדפן מקבל מ-Google טוקן חתום ושולח אותו אלינו. כאן בודקים שהחתימה של Google,
שהטוקן הונפק עבור ה-Client ID שלנו (aud) ושלא פג תוקפו — רק אז סומכים על האימייל שבו.
"""
from google.auth.exceptions import GoogleAuthError, TransportError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from starlette.concurrency import run_in_threadpool

from .config import settings
from .errors import ApiError

_transport = google_requests.Request()


async def verify_google_credential(credential: str) -> dict:
    """מחזיר את פרטי המשתמש מהטוקן (sub, email, name...) או זורק ApiError."""
    if not settings.google_client_id:
        raise ApiError(503, "התחברות עם Google אינה מוגדרת בשרת")
    try:
        # פעולה סינכרונית (מורידה את המפתחות הציבוריים של Google) — מחוץ ל-event loop
        info = await run_in_threadpool(
            id_token.verify_oauth2_token, credential, _transport, settings.google_client_id, clock_skew_in_seconds=10
        )
    except TransportError:
        raise ApiError(503, "אין חיבור ל-Google כרגע. נסו שוב בעוד רגע")
    except (ValueError, GoogleAuthError):
        raise ApiError(401, "ההתחברות עם Google נכשלה. נסו שוב")
    if not info.get("email_verified"):
        raise ApiError(401, "כתובת האימייל בחשבון Google אינה מאומתת")
    return info
