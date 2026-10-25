declare global {
  interface Window {
    __CONFIG__?: { API_URL?: string };
  }
}

/** כתובת השרת: מגיעה מ-config.js (נוצר ממשתנה סביבה), לא קבועה בקוד. */
export const API_URL = (window.__CONFIG__?.API_URL ?? "http://localhost:8000").replace(/\/$/, "");
