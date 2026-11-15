import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";
import { contentTypeInfo, CONTENT_TYPES } from "../contentTypes";
import FocusChart from "../components/FocusChart";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import Shape from "../components/Shape";
import { bestHours, computeStats, fmtHourRange, fmtStudyTime, MIN_SESSIONS_FOR_HOURS, recentScored } from "../homeStats";
import type { ContentItem, SessionSummary } from "../types";
import { fmtDate, fmtScore, isLowScore } from "./History";

const RECENT_ITEMS = 3;

/** טעינת נתיב GET עם מצבי טעינה/שגיאה ואפשרות לניסיון נוסף. */
function useResource<T>(path: string) {
  const [state, setState] = useState<{ data: T | null; error: string; loading: boolean }>({ data: null, error: "", loading: true });
  const load = useCallback(() => {
    setState({ data: null, error: "", loading: true });
    api<T>(path)
      .then((data) => setState({ data, error: "", loading: false }))
      .catch((e: ApiError) => setState({ data: null, error: e.message, loading: false }));
  }, [path]);
  useEffect(load, [load]);
  return { ...state, reload: load };
}

/** דף הבית: תמונת מצב אישית של הלמידה. כל החישובים בצד הלקוח, מ-/api/sessions ומ-/api/content. */
export default function Home() {
  const { user } = useAuth();
  const sessions = useResource<SessionSummary[]>("/api/sessions");
  const content = useResource<ContentItem[]>("/api/content");

  const header = (
    <PageHeader title={`שלום, ${user?.display_name ?? ""}`} shape="triangle" color="var(--yellow)" subtitle="הנה תמונת המצב של הלמידה והקשב שלכם." />
  );

  if (sessions.loading || content.loading) return <>{header}<Loader label="טוען את הנתונים שלכם…" /></>;

  // משתמש חדש לגמרי: אין תוכן ואין סשנים
  if (sessions.data?.length === 0 && content.data?.length === 0) return <>{header}<Welcome /></>;

  return (
    <>
      {header}
      <div className="home">
        {sessions.error ? (
          <LoadError what="הסשנים" message={sessions.error} onRetry={sessions.reload} />
        ) : sessions.data && sessions.data.length === 0 ? (
          <NoSessionsYet />
        ) : sessions.data && (
          <SessionsOverview sessions={sessions.data} />
        )}

        {content.error ? (
          <LoadError what="הפריטים בספרייה" message={content.error} onRetry={content.reload} />
        ) : content.data && content.data.length > 0 && (
          <RecentItems items={content.data.slice(0, RECENT_ITEMS)} />
        )}
      </div>
    </>
  );
}

function LoadError({ what, message, onRetry }: { what: string; message: string; onRetry: () => void }) {
  return (
    <div className="card home-error" role="alert">
      <p className="error">לא הצלחנו לטעון את {what}. {message}</p>
      <button type="button" className="btn secondary small" onClick={onRetry}>ניסיון נוסף</button>
    </div>
  );
}

/** מצב ריק למשתמש חדש: שלושה צעדים וכפתור התחלה. */
function Welcome() {
  const steps = [
    { shape: "circle" as const, color: "var(--red)", title: "מוסיפים פריט לספרייה", text: "סרטון YouTube, טקסט או קישור לדף אינטרנט." },
    { shape: "square" as const, color: "var(--blue)", title: "מתחילים סשן ומאשרים מצלמה", text: "הווידאו לא עוזב את המכשיר — רק ציון הקשב נשמר." },
    { shape: "triangle" as const, color: "var(--yellow)", title: "רואים את הקשב כאן", text: "ממוצעים, גרף והשעות שבהן אתם הכי מרוכזים." },
  ];
  return (
    <section className="card welcome pop-yellow" aria-labelledby="welcome-h">
      <h2 id="welcome-h">מתחילים ב-3 צעדים</h2>
      <ol className="welcome-steps">
        {steps.map((s, i) => (
          <li key={s.title}>
            <span className="welcome-steps__num" aria-hidden="true"><Shape kind={s.shape} color={s.color} outline />{i + 1}</span>
            <strong>{s.title}</strong>
            <span className="muted">{s.text}</span>
          </li>
        ))}
      </ol>
      <Link className="btn accent" to="/library">הוספת פריט ראשון</Link>
    </section>
  );
}

/** יש תוכן אבל עוד אין סשנים. */
function NoSessionsYet() {
  return (
    <section className="card home-hint pop-blue" aria-labelledby="nosess-h">
      <h2 id="nosess-h">עוד לא התחלתם סשן</h2>
      <p>פתחו פריט מהספרייה ולחצו "התחלת סשן". אחרי הסשן הראשון תראו כאן את ציון הקשב, זמן הלימוד והגרף.</p>
      <Link className="btn" to="/library">בחרו פריט והתחילו סשן</Link>
    </section>
  );
}

function SessionsOverview({ sessions }: { sessions: SessionSummary[] }) {
  const stats = computeStats(sessions);
  const chart = recentScored(sessions, 10);
  const hours = bestHours(sessions);

  return (
    <>
      <ResumeCard session={sessions[0]} />

      <section aria-labelledby="summary-h">
        <h2 id="summary-h" className="visually-hidden">סיכום</h2>
        <div className="stats four">
          <Stat label="סשנים" value={stats.total} sub={`${stats.thisWeek} בשבוע האחרון`} color="var(--yellow)" />
          <Stat label="זמן לימוד השבוע" value={fmtStudyTime(stats.weekStudyMs)} sub={stats.weekStudyMs == null ? "אין סשנים שהסתיימו השבוע" : "סשנים שהסתיימו ב-7 הימים האחרונים"} color="var(--blue)" />
          <Stat
            label="ציון קשב ממוצע"
            value={fmtScore(stats.averageScore)}
            sub={stats.averageScore == null ? "אין עדיין סשנים עם מדידות" : "בסולם 0–1, בסשנים עם מדידות"}
            color={isLowScore(stats.averageScore) ? "var(--red)" : "var(--blue)"}
          />
          <Stat label="הסשן הטוב ביותר" value={fmtScore(stats.best?.average_score)} sub={stats.best ? (stats.best.content_title ?? "פריט שנמחק") : "—"} color="var(--red)" />
        </div>
      </section>

      <section className="card" aria-labelledby="chart-h">
        <h2 id="chart-h">הקשב שלי בסשנים האחרונים</h2>
        {chart.length > 0 ? (
          <>
            <p className="muted">הציון הממוצע ב-{chart.length} הסשנים האחרונים שבהם נמדד קשב, מהישן (שמאל) לחדש (ימין). העבירו את העכבר על נקודה לפרטים.</p>
            <FocusChart sessions={chart} />
          </>
        ) : (
          <p className="muted">עדיין אין סשנים עם מדידות קשב. הפעילו את המצלמה במהלך סשן כדי לראות כאן גרף.</p>
        )}
      </section>

      {hours && <BestHours hours={hours} />}
    </>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="stat" style={{ "--stat-color": color } as CSSProperties}>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      <div className="stat__sub">{sub}</div>
    </div>
  );
}

/** "המשך מאיפה שהפסקת": הסשן האחרון. */
function ResumeCard({ session }: { session: SessionSummary }) {
  const info = contentTypeInfo(session.content_type);
  const deleted = !session.content_title;
  const low = isLowScore(session.average_score);
  return (
    <section className="card resume pop-yellow" aria-labelledby="resume-h">
      <div className={`score-circle ${low ? "low" : ""}`} aria-hidden="true">{fmtScore(session.average_score)}</div>
      <div className="resume__text">
        <span className="latest-score__label">המשך מאיפה שהפסקת</span>
        <h2 id="resume-h">{deleted ? "הפריט נמחק" : session.content_title}</h2>
        <p className="resume__meta">
          {info && <span className="tag"><Shape kind={info.shape} color={info.color} outline />{info.label}</span>}
          <span className="muted">{fmtDate(session.started_at)}</span>
          <span>ציון ממוצע: <strong>{fmtScore(session.average_score)}</strong></span>
        </p>
        <div className="actions">
          {!deleted && <Link className="btn" to={`/content/${session.content_id}`}>המשך לצפות</Link>}
          <Link className="btn secondary small" to={`/history/${session.id}`}>פרטי הסשן</Link>
        </div>
      </div>
    </section>
  );
}

function BestHours({ hours }: { hours: { hour: number; average: number; sessions: number }[] }) {
  return (
    <section className="card" aria-labelledby="hours-h">
      <h2 id="hours-h">שעות הקשב הטובות שלי</h2>
      <p className="muted">לפי שעת ההתחלה של הסשנים (בשעון המכשיר שלכם), מתוך סשנים עם מדידות. מוצג מ-{MIN_SESSIONS_FOR_HOURS} סשנים ומעלה.</p>
      <ol className="best-hours">
        {hours.map((h, i) => (
          <li key={h.hour}>
            <span className="best-hours__rank" aria-hidden="true">{i + 1}</span>
            <span className="best-hours__time" dir="ltr">{fmtHourRange(h.hour)}</span>
            <span>ציון ממוצע <strong>{fmtScore(h.average)}</strong></span>
            <span className="muted">{h.sessions === 1 ? "סשן אחד" : `${h.sessions} סשנים`}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RecentItems({ items }: { items: ContentItem[] }) {
  return (
    <section className="card" aria-labelledby="recent-h">
      <div className="list-head">
        <h2 id="recent-h">פריטים אחרונים בספרייה</h2>
        <Link to="/library">לכל הספרייה</Link>
      </div>
      <ul className="recent-items">
        {items.map((it) => {
          const info = CONTENT_TYPES[it.type];
          return (
            <li key={it.id}>
              <Shape kind={info.shape} color={info.color} outline className="recent-items__shape" />
              <div className="recent-items__text">
                <Link to={`/content/${it.id}`} className="recent-items__title">{it.title}</Link>
                <span className="muted">{info.label} · נוסף {fmtDate(it.created_at)}</span>
              </div>
              <Link className="btn small" to={`/content/${it.id}`} aria-label={`פתיחה: ${it.title}`}>פתיחה</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
