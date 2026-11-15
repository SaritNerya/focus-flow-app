/** עוצמת רקע המפה ומצב התנועה לפי הנתיב. */
export interface TopoMode {
  intensity: 1 | 0.5;   // מכפיל את אטימות כל הקווים
  animated: boolean;    // false = רקע סטטי (בלי requestAnimationFrame)
}

const FULL = new Set(["/", "/login", "/register"]); // נחיתה / דף הבית, התחברות, הרשמה

export function topoModeFor(pathname: string): TopoMode {
  // בדף התוכן רץ סשן עם מצלמה: רקע סטטי תמיד, כדי לא להתחרות ב-MediaPipe וב-ONNX על המעבד
  if (pathname.startsWith("/content/")) return { intensity: 0.5, animated: false };
  if (FULL.has(pathname)) return { intensity: 1, animated: true };
  return { intensity: 0.5, animated: true }; // ספרייה, היסטוריה, פרטי סשן, פרופיל, 404
}
