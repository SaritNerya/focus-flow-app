import { useEffect, useState } from "react";
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
      <PageHeader title="היסטוריית סשנים" shape="square" color="var(--blue)" subtitle="כל סשני הלמידה שלכם וציוני הקשב שנמדדו בהם" />
      {error && <p className="error" role="alert">{error}</p>}
      {rows === null && !error && <Loader />}
      {rows?.length === 0 && (
        <EmptyState title="עדיין אין סשנים">
          פתחו פריט מ<Link to="/">הספרייה</Link> ולחצו "התחלת סשן" — הציונים יופיעו כאן.
        </EmptyState>
      )}

      {latest && <LatestScore session={latest} />}

      {rows && rows.length > 0 && (
        <div className="card table-wrap">
          <table className="responsive-table">
            <thead><tr><th>תאריך</th><th>תוכן</th><th>מדידות</th><th>ציון קשב ממוצע (0–1)</th><th><span className="visually-hidden">פעולות</span></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.id === latest?.id ? "highlight" : undefined}>
                  <td data-label="תאריך">{fmtDate(r.started_at)}</td>
                  <td data-label="תוכן">{r.content_title ?? "פריט שנמחק"}</td>
                  <td data-label="מדידות">{r.reading_count}</td>
                  <td data-label="ציון ממוצע">
                    <span>{fmtScore(r.average_score)}{r.id === latest?.id && <span className="badge">אחרון</span>}</span>
                  </td>
                  <td><Link className="btn secondary small" to={`/history/${r.id}`}>פרטים</Link></td>
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
    <section className="card latest-score pop-yellow" aria-labelledby="latest-score-label">
      <div className={`score-circle ${low ? "low" : ""}`}>{fmtScore(session.average_score)}</div>
      <div className="latest-score__text">
        <span id="latest-score-label" className="latest-score__label">ציון הקשב בסשן האחרון</span>
        <h2>{session.content_title ?? "פריט שנמחק"}</h2>
        <p className="muted">{fmtDate(session.started_at)}</p>
        <p>
          זהו ציון הקשב הממוצע שנמדד בסשן הלימוד האחרון שלכם, בסולם 0–1 (1 = קשב מלא).
          {low && " הציון נמוך — אולי כדאי לנסות סשן קצר יותר או ללמוד בשעה אחרת."}
        </p>
        <Link className="btn small" to={`/history/${session.id}`}>לפרטי הסשן</Link>
      </div>
    </section>
  );
}
