import type { FieldErrors } from "./api";

export const PASSWORD_HINT = "לפחות 8 תווים, כולל אותיות וספרות";
export const CONFIRM_HINT = "יש להקליד את הסיסמה שוב (לא ניתן להדביק)";

/** אותם כללים כמו בשרת (check_password ב-schemas.py). */
export function passwordError(password: string): string | undefined {
  if (password.length < 8) return "הסיסמה קצרה מדי: נדרשים לפחות 8 תווים";
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return "הסיסמה חייבת לכלול לפחות אות אחת וספרה אחת";
  return undefined;
}

/**
 * בדיקת סיסמה חדשה ושדה האימות שלה.
 * passwordField = שם השדה כפי שהשרת מחזיר אותו, כדי ששגיאות מקומיות ושגיאות שרת יוצגו באותו מקום.
 */
export function validateNewPassword(password: string, confirm: string, passwordField = "password"): FieldErrors {
  const pwErr = passwordError(password);
  if (pwErr) return { [passwordField]: pwErr };
  if (!confirm) return { confirm: "יש להזין שוב את הסיסמה" };
  if (password !== confirm) return { confirm: "הסיסמאות אינן תואמות" };
  return {};
}

/** שגיאת "שדה חובה" לשדה ריק (רווחים בלבד נחשבים ריק). */
export function requireField(value: string, field: string, message: string): FieldErrors {
  return value.trim() ? {} : { [field]: message };
}
