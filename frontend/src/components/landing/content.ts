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

export interface HeroText { eyebrow: string; titleStart: string; titleAccent: string; lead: string; note: string }

export const HERO: HeroText = {
  eyebrow: "מדידת קשב דרך המצלמה, בתוך הדפדפן",
  titleStart: "לומדים",
  titleAccent: "בקשב",
  lead: "FocusFlow מעריך את רמת הקשב שלכם דרך המצלמה בזמן שאתם צופים בסרטון או קוראים טקסט, ומתריע כשהריכוז יורד.",
  note: "הווידאו לא עוזב את המכשיר · החישוב נעשה בדפדפן",
};

export const HOW_IT_WORKS: SectionText & { eyebrow: string; steps: ShapedItem[] } = {
  eyebrow: "המסלול",
  title: "איך זה עובד",
  steps: [
    { shape: "circle", color: "var(--lake)", title: "מוסיפים תוכן", text: "סרטון YouTube, טקסט או דף אינטרנט." },
    { shape: "square", color: "var(--moss)", title: "מתחילים סשן ומאשרים מצלמה", text: "המצלמה נדלקת רק כשאתם מבקשים." },
    { shape: "triangle", color: "var(--summit)", title: "רואים את ציון הקשב", text: "בזמן אמת במהלך הסשן, ואחר כך בהיסטוריה." },
  ],
};

export const FEATURES: SectionText & { eyebrow: string; items: ShapedItem[] } = {
  eyebrow: "הציוד",
  title: "מה מקבלים",
  items: [
    { shape: "circle", color: "var(--lake)", title: "ספרייה אישית", text: "סרטונים, טקסטים ודפי אינטרנט שאתם לומדים מהם, במקום אחד." },
    { shape: "square", color: "var(--moss)", title: "ציון קשב בין 0 ל-1", text: "מתעדכן כל כמה שניות במהלך הסשן." },
    { shape: "triangle", color: "var(--ochre)", title: "התראה כשהקשב יורד", text: "כשהציון יורד מתחת לסף, מופיעה תזכורת לחזור לריכוז." },
    { shape: "circle", color: "var(--ink)", title: "היסטוריית סשנים", text: "הציון הממוצע של כל סשן והמדידות לאורך התוכן." },
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
