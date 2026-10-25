import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import NotFound from "../components/NotFound";
import type { SessionDetail } from "../types";
import { fmtDate, fmtScore } from "./History";

export default function SessionPage() {
  const { id } = useParams();
  const [s, setS] = useState<SessionDetail | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "error">("loading");

  useEffect(() => {
    api<SessionDetail>(`/api/sessions/${id}`)
      .then((d) => { setS(d); setState("ok"); })
      .catch((e: ApiError) => setState(e.status === 404 ? "missing" : "error"));
  }, [id]);

  if (state === "loading") return <p className="muted">טוען…</p>;
  if (state === "missing") return <NotFound what="הסשן" />;
  if (state === "error" || !s) return <p className="error" role="alert">לא הצלחנו לטעון את הסשן.</p>;

  return (
    <>
      <p><Link to="/history">← חזרה להיסטוריה</Link></p>
      <h1>סשן: {s.content_title ?? "פריט שנמחק"}</h1>
      <p className="muted">התחיל: {fmtDate(s.started_at)} · ציון קשב ממוצע: <strong>{fmtScore(s.average_score)}</strong> · {s.reading_count} מדידות</p>
      {s.readings.length === 0 ? (
        <div className="card center"><p>בסשן הזה לא נשמרו מדידות.</p></div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>זמן</th><th>מיקום בתוכן</th><th>ציון קשב (0–1)</th></tr></thead>
            <tbody>
              {s.readings.map((r, i) => (
                <tr key={i}><td>{fmtDate(r.created_at)}</td><td>{r.position}</td><td>{fmtScore(r.score)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
