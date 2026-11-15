/** ערכת צבעים (יום/לילה): ברירת מחדל לפי הגדרות המערכת, ובחירה ידנית נשמרת בדפדפן. */
export type Theme = "light" | "dark";

const KEY = "ff_theme";

export function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* אחסון חסום — נשארים עם הגדרת המערכת */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const currentTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function saveTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* אחסון חסום — הבחירה תקפה רק עד רענון */
  }
}
