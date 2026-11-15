import type { ShapeKind } from "../Shape";

/** כל הטקסטים של דף הנחיתה. הרכיבים ב-components/landing רק מציגים אותם. */

export interface CtaLink { to: string; label: string; className: string }
export interface ShapedItem { shape: ShapeKind; color: string; title: string; text: string }
export interface SectionText { title: string; lead?: string }

export const SITE_NAME = "FocusFlow";

export const CTA_LINKS: CtaLink[] = [
  { to: "/register", label: "הרשמה", className: "btn" },
  { to: "/login", label: "התחברות", className: "btn secondary" },
];

export const HERO: SectionText = {
  title: "לומדים בקשב",
  lead: "FocusFlow מעריך את רמת הקשב שלכם דרך המצלמה בזמן שאתם צופים בסרטון או קוראים טקסט, ומתריע כשהריכוז יורד.",
};

export const HOW_IT_WORKS: SectionText & { steps: ShapedItem[] } = {
  title: "איך זה עובד",
  steps: [
    { shape: "circle", color: "var(--red)", title: "מוסיפים תוכן", text: "סרטון YouTube, טקסט או דף אינטרנט." },
    { shape: "square", color: "var(--blue)", title: "מתחילים סשן ומאשרים מצלמה", text: "המצלמה נדלקת רק כשאתם מבקשים." },
    { shape: "triangle", color: "var(--yellow)", title: "רואים את ציון הקשב", text: "בזמן אמת במהלך הסשן, ואחר כך בהיסטוריה." },
  ],
};

export const FEATURES: SectionText & { items: ShapedItem[] } = {
  title: "מה מקבלים",
  items: [
    { shape: "circle", color: "var(--red)", title: "ספרייה אישית", text: "סרטונים, טקסטים ודפי אינטרנט שאתם לומדים מהם, במקום אחד." },
    { shape: "square", color: "var(--blue)", title: "ציון קשב בין 0 ל-1", text: "מתעדכן כל כמה שניות במהלך הסשן." },
    { shape: "triangle", color: "var(--yellow)", title: "התראה כשהקשב יורד", text: "כשהציון יורד מתחת לסף, מופיעה תזכורת לחזור לריכוז." },
    { shape: "square", color: "var(--red)", title: "היסטוריית סשנים", text: "הציון הממוצע של כל סשן והמדידות לאורך התוכן." },
  ],
};

export const PRIVACY: SectionText & { points: string[] } = {
  title: "פרטיות",
  points: [
    "הווידאו לא עוזב את המכשיר שלך ולא נשמר.",
    "החישוב נעשה בדפדפן.",
    "לשרת נשמרים רק ציון הקשב (מספר בין 0 ל-1) והמיקום בתוכן.",
    "המצלמה נדלקת רק אחרי שלוחצים על הכפתור ומאשרים בדפדפן.",
  ],
};

export const HONEST_NOTE: SectionText & { text: string } = {
  title: "חשוב לדעת",
  text: "ציון הקשב הוא הערכה סטטיסטית של מודל, ואינו כלי אבחון או מדידה מדויקת. הוא נועד לעזור לכם לשים לב לריכוז, לא לשפוט אותו.",
};

export const FINAL_CTA: SectionText = {
  title: "מוכנים להתחיל?",
  lead: "יוצרים חשבון, מוסיפים פריט ראשון ומתחילים סשן.",
};
