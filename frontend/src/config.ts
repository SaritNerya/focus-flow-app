declare global {
  interface Window {
    __CONFIG__?: { API_URL?: string; GOOGLE_CLIENT_ID?: string };
  }
}

/** כתובת השרת: מגיעה מ-config.js (נוצר ממשתנה סביבה), לא קבועה בקוד. */
export const API_URL = (window.__CONFIG__?.API_URL ?? "http://localhost:8000").replace(/\/$/, "");

/** מזהה הלקוח של Google (לא סוד). ריק = כפתור Google לא מוצג. */
export const GOOGLE_CLIENT_ID = window.__CONFIG__?.GOOGLE_CLIENT_ID?.trim() ?? "";
