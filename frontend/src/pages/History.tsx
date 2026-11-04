import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import type { SessionSummary } from "../types";
import { LOW_FOCUS_THRESHOLD } from "../attention/config";

export const fmtScore = (s?: number | null) => (s == null ? "—" : s.toFixed(2));
export const fmtDate = (s: string) => new Date(s).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });

export default function History() {
  const [rows, setRows] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<SessionSummary[]>("/api/sessions").then(setRows).catch((e: ApiError) => setError(e.message));
  }, []);

  // הרשימה ממוינת מהחדש לישן — הסשן האחרון שיש לו ציון
  const latest = rows?.find((r) => r.average_score != null) ?? null;
  const latestLow = latest?.average_score != null && latest.average_score < LOW_FOCUS_THRESHOLD;

  return (
    <>
      <h1>היסטוריית סשנים</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {rows === null && !error && <p className="muted">טוען…</p>}
      {rows?.length === 0 && <div className="card center"><p>עדיין אין סשנים. פתחו פריט מהספרייה והתחילו סשן.</p></div>}
      {latest && (
        <section className="card latest-score" aria-labelledby="latest-score-label">
          <div>
            <div id="latest-score-label" className="score-label">ציון הקשב בסשן האחרון</div>
            <div className={`score-value ${latestLow ? "low" : ""}`}>{fmtScore(latest.average_score)}</div>
          </div>
          <div>
            <p><strong>{latest.content_title ?? "פריט שנמחק"}</strong> · {fmtDate(latest.started_at)}</p>
            <p className="muted">זהו ציון הקשב הממוצע שנמדד בסשן הלימוד האחרון שלכם, בסולם 0–1 (1 = קשב מלא).</p>
            <Link to={`/history/${latest.id}`}>לפרטי הסשן</Link>
          </div>
        </section>
      )}
      {rows && rows.length > 0 && (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>תאריך</th><th>תוכן</th><th>מספר מדידות</th><th>ציון קשב ממוצע (0–1)</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.id === latest?.id ? "latest-row" : undefined}>
                  <td>{fmtDate(r.started_at)}</td>
                  <td>{r.content_title ?? "פריט שנמחק"}</td>
                  <td>{r.reading_count}</td>
                  <td>{fmtScore(r.average_score)}{r.id === latest?.id && <span className="badge">אחרון</span>}</td>
                  <td><Link to={`/history/${r.id}`}>פרטים</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
