"""כל ההגדרות והסודות מגיעים ממשתני סביבה (קובץ .env), לא מהקוד."""
from pydantic import ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

MIN_SECRET_LEN = 32


class Settings(BaseSettings):
    # בתוך Docker הכתובת היא שם השירות (mongo), לא localhost
    mongo_url: str = "mongodb://mongo:27017"
    mongo_db: str = "focusflow"

    # סוד החתימה של הטוקנים (JWT). חובה ב-.env — אין ברירת מחדל
    secret_jwt: str
    jwt_expire_minutes: int = 60

    cors_origins: str = "http://localhost:3000"

    # הגנה על חשבון
    max_login_attempts: int = 5
    lockout_minutes: int = 15
    password_require_mixed: bool = True  # True = חובה אות וגם ספרה

    # הגבלת קצב לפי IP על התחברות והרשמה (לכל נתיב בנפרד)
    rate_limit_per_minute: int = 20
    # כמה פרוקסים מהימנים עומדים לפני השרת ומוסיפים את כתובת הלקוח ל-X-Forwarded-For.
    # 0 = חיבור ישיר (Docker מקומי): הכותרת לא נקראת בכלל. Cloud Run = 1. Load Balancer + Cloud Run = 2.
    trusted_proxy_hops: int = 0

    # התחברות עם Google. ריק = הכפתור מושבת והאתר עובד כרגיל
    google_client_id: str = ""

    # אופציונלי - האתר חייב לעבוד גם בלי זה
    gemini_api_key: str = ""

    # hide_input_in_errors: הודעת שגיאה לעולם לא תכלול את ערך הסוד
    model_config = SettingsConfigDict(extra="ignore", hide_input_in_errors=True)

    @field_validator("secret_jwt")
    @classmethod
    def _strong_secret(cls, v: str) -> str:
        if len(v) < MIN_SECRET_LEN:
            raise ValueError(f"חייב להכיל לפחות {MIN_SECRET_LEN} תווים")
        return v

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


def load_settings() -> Settings:
    """טוען את ההגדרות. הגדרה חסרה או לא תקינה עוצרת את השרת בעלייה עם הודעה ברורה (בלי ערכים)."""
    try:
        return Settings()
    except ValidationError as e:
        problems = "; ".join(
            f"{'.'.join(map(str, err['loc'])).upper()}: "
            + ("חסר" if err["type"] == "missing" else err["msg"].removeprefix("Value error, "))
            for err in e.errors(include_input=False)
        )
        raise SystemExit(
            f"הגדרות השרת אינן תקינות — {problems}. "
            f'הגדירו ב-.env, למשל SECRET_JWT: python -c "import secrets; print(secrets.token_urlsafe(48))"'
        ) from None


settings = load_settings()
