import type { SessionSummary } from "./types";

/**
 * חישובי דף הבית — פונקציות טהורות על רשימת הסשנים מ-GET /api/sessions
 * (השרת מחזיר אותה ממוינת מהחדש לישן). שום מספר לא מומצא: כשאין נתון מחזירים null.
 */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const MIN_SESSIONS_FOR_HOURS = 5;

/** סשן שיש לו ציון: לפחות מדידה אחת. סשן בלי מדידות לא נספר בממוצעים. */
export type ScoredSession = SessionSummary & { average_score: number };
export const isScored = (s: SessionSummary): s is ScoredSession => s.reading_count > 0 && s.average_score != null;

const isThisWeek = (s: SessionSummary, now: number) => now - new Date(s.started_at).getTime() <= WEEK_MS;

export interface HomeStats {
  total: number;                    // כל הסשנים
  thisWeek: number;                 // סשנים שהתחילו ב-7 הימים האחרונים
  weekStudyMs: number | null;       // זמן לימוד ב-7 הימים האחרונים (רק סשנים שנסגרו); null = אין סשן סגור השבוע
  averageScore: number | null;      // ממוצע הציונים הממוצעים של סשנים עם מדידות
  best: ScoredSession | null;       // הסשן עם הציון הממוצע הגבוה ביותר
}

export function computeStats(sessions: SessionSummary[], now = Date.now()): HomeStats {
  const week = sessions.filter((s) => isThisWeek(s, now));
  const closedThisWeek = week.filter((s) => s.ended_at);
  const scored = sessions.filter(isScored);

  return {
    total: sessions.length,
    thisWeek: week.length,
    weekStudyMs: closedThisWeek.length
      ? closedThisWeek.reduce((sum, s) => sum + Math.max(0, new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime()), 0)
      : null,
    averageScore: scored.length ? scored.reduce((sum, s) => sum + s.average_score, 0) / scored.length : null,
    best: scored.reduce<ScoredSession | null>((b, s) => (!b || s.average_score > b.average_score ? s : b), null),
  };
}

/** עד `count` הסשנים האחרונים שיש להם ציון, מהישן לחדש (לגרף). */
export const recentScored = (sessions: SessionSummary[], count = 10) => sessions.filter(isScored).slice(0, count).reverse();

export interface HourStat { hour: number; average: number; sessions: number }

/**
 * השעות ביום שבהן הקשב הממוצע הכי גבוה, לפי שעת ההתחלה של הסשן בשעון המקומי של הדפדפן.
 * מחזיר null אם יש פחות מ-MIN_SESSIONS_FOR_HOURS סשנים עם מדידות, או שכולם באותה שעה (אין מה להשוות).
 */
export function bestHours(sessions: SessionSummary[], top = 3): HourStat[] | null {
  const scored = sessions.filter(isScored);
  if (scored.length < MIN_SESSIONS_FOR_HOURS) return null;

  const byHour = new Map<number, { sum: number; n: number }>();
  for (const s of scored) {
    const h = new Date(s.started_at).getHours();
    const g = byHour.get(h) ?? { sum: 0, n: 0 };
    byHour.set(h, { sum: g.sum + s.average_score, n: g.n + 1 });
  }
  if (byHour.size < 2) return null;

  return [...byHour.entries()]
    .map(([hour, g]) => ({ hour, average: g.sum / g.n, sessions: g.n }))
    .sort((a, b) => b.average - a.average || b.sessions - a.sessions)
    .slice(0, top);
}

/** "1 שע' 25 דק'" / "40 דק'" / "פחות מדקה". */
export function fmtStudyTime(ms: number | null): string {
  if (ms == null) return "—";
  const min = Math.round(ms / 60000);
  if (min < 1) return "פחות מדקה";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} שע'${m ? ` ${m} דק'` : ""}` : `${m} דק'`;
}

/** "16:00–17:00". */
export const fmtHourRange = (h: number) => `${String(h).padStart(2, "0")}:00–${String((h + 1) % 24).padStart(2, "0")}:00`;
