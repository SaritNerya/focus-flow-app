import os
import secrets

import pytest

# השרת לא עולה בלי SECRET_JWT (לפחות 32 תווים). בבדיקות: סוד אקראי חדש בכל הרצה, לפני שהאפליקציה נטענת
os.environ.setdefault("SECRET_JWT", secrets.token_urlsafe(48))


@pytest.fixture(autouse=True)
def _fresh_rate_limiter():
    """כל בדיקה מתחילה עם מונה הגבלת קצב ריק."""
    from app.limits import auth_limiter

    auth_limiter.reset()
    yield
    auth_limiter.reset()
