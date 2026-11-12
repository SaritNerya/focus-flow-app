from fastapi import APIRouter, Depends, Response
from pymongo import ReturnDocument

from .. import db
from ..deps import current_user
from ..errors import ApiError
from ..schemas import AccountDelete, PasswordChange, TokenOut, UserOut, UserUpdate
from ..security import hash_password, verify_password
from .auth import issue_token

router = APIRouter(prefix="/api/users", tags=["users"])


def to_user_out(u: dict) -> UserOut:
    return UserOut(
        id=str(u["_id"]),
        email=u["email"],
        display_name=u["display_name"],
        created_at=db.as_utc(u["created_at"]),
        has_password=bool(u.get("password_hash")),
    )


async def require_password(user: dict, password: str, field: str) -> None:
    """מוודא שהמשתמש הזין את הסיסמה הנוכחית שלו לפני פעולה רגישה."""
    if not await verify_password(password, user["password_hash"]):
        raise ApiError(400, "הסיסמה הנוכחית שגויה", {field: "הסיסמה הנוכחית שגויה"})


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(current_user)):
    return to_user_out(user)


@router.patch("/me", response_model=UserOut)
async def update_me(body: UserUpdate, user: dict = Depends(current_user)):
    await db.get_db().users.update_one({"_id": user["_id"]}, {"$set": {"display_name": body.display_name}})
    user["display_name"] = body.display_name
    return to_user_out(user)


@router.post("/me/password", response_model=TokenOut)
async def change_password(body: PasswordChange, user: dict = Depends(current_user)):
    """מחליף סיסמה ומנתק את כל שאר המכשירים. מחזיר טוקן חדש כדי שהמשתמש הנוכחי יישאר מחובר."""
    if not user.get("password_hash"):
        raise ApiError(400, "לחשבון הזה אין סיסמה — ההתחברות היא דרך Google")
    await require_password(user, body.current_password, "current_password")
    if body.new_password == body.current_password:
        raise ApiError(400, "הסיסמה החדשה זהה לסיסמה הנוכחית", {"new_password": "הסיסמה החדשה זהה לסיסמה הנוכחית"})
    # העלאת token_version פוסלת את כל הטוקנים שהונפקו קודם
    updated = await db.get_db().users.find_one_and_update(
        {"_id": user["_id"]},
        {"$set": {"password_hash": await hash_password(body.new_password)}, "$inc": {"token_version": 1}},
        return_document=ReturnDocument.AFTER,
    )
    return issue_token(updated)


@router.delete("/me", status_code=204, response_class=Response)
async def delete_me(body: AccountDelete, user: dict = Depends(current_user)):
    """מחיקת חשבון לצמיתות, כולל כל הנתונים של המשתמש.
    אישור: הסיסמה, או — למשתמש Google בלי סיסמה — הקלדת האימייל של החשבון."""
    if user.get("password_hash"):
        await require_password(user, body.password, "password")
    elif body.email.strip().lower() != user["email"]:
        raise ApiError(400, "האימייל אינו תואם לחשבון", {"email": "האימייל אינו תואם לחשבון"})
    database = db.get_db()
    # קודם הנתונים ואחר כך המשתמש — אם משהו נכשל באמצע, אפשר לנסות שוב
    await database.sessions.delete_many({"user_id": user["_id"]})
    await database.content.delete_many({"owner_id": user["_id"]})
    await database.login_attempts.delete_one({"_id": user["email"]})
    await database.users.delete_one({"_id": user["_id"]})
    return Response(status_code=204)
