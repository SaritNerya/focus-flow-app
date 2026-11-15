import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import { LOW_FOCUS_THRESHOLD } from "../attention/config";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import type { SessionSummary } from "../types";

export const fmtScore = (s?: number | null) => (s == null ? "—" : s.toFixed(2));
export const fmtDate = (s: string) => new Date(s).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
export const isLowScore = (s?: number | null) => s != null && s < LOW_FOCUS_THRESHOLD;

export default function History() {
  const [rows, setRows] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<SessionSummary[]>("/api/sessions").then(setRows).catch((e: ApiError) => setError(e.message));
  }, []);

  // הרשימה ממוינת מהחדש לישן — הסשן האחרון שיש לו ציון
  const latest = rows?.find((r) => r.average_score != null) ?? null;

  return (
    <>
      <PageHeader
        title="היסטוריית סשנים"
        caption="יומן מסע"
        subtitle={rows?.length ? `${rows.length} סשנים, מהחדש לישן · ציון קשב בין 0 ל-1 (1 = קשב מלא)` : "כל סשני הלמידה שלכם וציוני הקשב שנמדדו בהם"}
      />
      {error && <p className="error" role="alert">{error}</p>}
      {rows === null && !error && <Loader />}
      {rows?.length === 0 && (
        <EmptyState title="עדיין אין סשנים">
          פתחו פריט מ<Link to="/library">הספרייה</Link> ולחצו "התחלת סשן" — הציונים יופיעו כאן.
        </EmptyState>
      )}

      {latest && <LatestScore session={latest} />}

      {rows && rows.length > 0 && (
        <div className="card table-wrap">
          <table className="responsive-table history-table">
            <thead><tr><th>תאריך</th><th>תוכן</th><th>מדידות</th><th>ציון קשב ממוצע (0–1)</th><th><span className="visually-hidden">פעולות</span></th></tr></thead>
            <tbody className="stagger">
              {rows.map((r, i) => (
                <tr key={r.id} className={r.id === latest?.id ? "highlight" : undefined} style={{ "--i": i } as CSSProperties}>
                  <td data-label="תאריך" className="num history-table__date">{fmtDate(r.started_at)}</td>
                  <td data-label="תוכן" className="history-table__title">{r.content_title ?? "פריט שנמחק"}</td>
                  <td data-label="מדידות" className="num history-table__count">{r.reading_count}</td>
                  <td data-label="ציון ממוצע" className="num history-table__score">
                    <span>{fmtScore(r.average_score)}{r.id === latest?.id && <span className="badge">אחרון</span>}</span>
                  </td>
                  <td className="history-table__link"><Link className="table-link" to={`/history/${r.id}`}>פרטים</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/** כרטיס בולט עם ציון הקשב של הסשן האחרון. */
function LatestScore({ session }: { session: SessionSummary }) {
  const low = isLowScore(session.average_score);
  return (
    <section className="card latest-score" aria-labelledby="latest-score-label">
      <div className={`giant score-big ${low ? "low" : ""}`}>{fmtScore(session.average_score)}</div>
      <div className="latest-score__text">
        <span id="latest-score-label" className="mono latest-score__label">ציון הקשב בסשן האחרון</span>
        <h2>{session.content_title ?? "פריט שנמחק"}</h2>
        <p className="mono">{fmtDate(session.started_at)}</p>
        {low && <p className="muted">הציון נמוך — אולי כדאי לנסות סשן קצר יותר או ללמוד בשעה אחרת.</p>}
      </div>
      <Link className="btn small" to={`/history/${session.id}`}>לפרטי הסשן</Link>
    </section>
  );
}
