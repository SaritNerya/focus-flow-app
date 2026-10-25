"""כל ההגדרות והסודות מגיעים ממשתני סביבה (קובץ .env), לא מהקוד."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # בתוך Docker הכתובת היא שם השירות (mongo), לא localhost
    mongo_url: str = "mongodb://mongo:27017"
    mongo_db: str = "focusflow"

    # סוד החתימה של הטוקנים (JWT). חובה להגדיר ב-.env
    secret_jwt: str = "dev-only-change-me"
    jwt_expire_minutes: int = 60

    cors_origins: str = "http://localhost:3000"

    # הגנה על חשבון
    max_login_attempts: int = 5
    lockout_minutes: int = 15
    password_require_mixed: bool = False  # True = חובה אות וגם ספרה

    # אופציונלי - האתר חייב לעבוד גם בלי זה
    gemini_api_key: str = ""

    model_config = SettingsConfigDict(extra="ignore")

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
