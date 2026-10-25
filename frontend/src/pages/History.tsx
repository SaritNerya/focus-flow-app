import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import type { SessionSummary } from "../types";

export const fmtScore = (s?: number | null) => (s == null ? "—" : s.toFixed(2));
export const fmtDate = (s: string) => new Date(s).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });

export default function History() {
  const [rows, setRows] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<SessionSummary[]>("/api/sessions").then(setRows).catch((e: ApiError) => setError(e.message));
  }, []);

  return (
    <>
      <h1>היסטוריית סשנים</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {rows === null && !error && <p className="muted">טוען…</p>}
      {rows?.length === 0 && <div className="card center"><p>עדיין אין סשנים. פתחו פריט מהספרייה והתחילו סשן.</p></div>}
      {rows && rows.length > 0 && (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>תאריך</th><th>תוכן</th><th>מספר מדידות</th><th>ציון קשב ממוצע (0–1)</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDate(r.started_at)}</td>
                  <td>{r.content_title ?? "פריט שנמחק"}</td>
                  <td>{r.reading_count}</td>
                  <td>{fmtScore(r.average_score)}</td>
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
