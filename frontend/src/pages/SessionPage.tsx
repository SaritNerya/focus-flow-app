import { useEffect, useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import NotFound from "../components/NotFound";
import PageHeader from "../components/PageHeader";
import type { SessionDetail } from "../types";
import { fmtDate, fmtScore, isLowScore } from "./History";

export default function SessionPage() {
  const { id } = useParams();
  const [s, setS] = useState<SessionDetail | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "error">("loading");

  useEffect(() => {
    api<SessionDetail>(`/api/sessions/${id}`)
      .then((d) => { setS(d); setState("ok"); })
      .catch((e: ApiError) => setState(e.status === 404 ? "missing" : "error"));
  }, [id]);

  if (state === "loading") return <Loader />;
  if (state === "missing") return <NotFound what="הסשן" />;
  if (state === "error" || !s) return <p className="error" role="alert">לא הצלחנו לטעון את הסשן.</p>;

  const stats = [
    { label: "ציון קשב ממוצע", value: fmtScore(s.average_score), color: isLowScore(s.average_score) ? "var(--red)" : "var(--blue)" },
    { label: "מדידות", value: s.reading_count, color: "var(--yellow)" },
    { label: "התחיל", value: fmtDate(s.started_at), color: "var(--ink)" },
  ];

  return (
    <>
      <PageHeader title={s.content_title ?? "פריט שנמחק"} subtitle="פרטי סשן" back={{ to: "/history", label: "חזרה להיסטוריה" }} />

      <div className="stats">
        {stats.map((st) => (
          <div key={st.label} className="stat" style={{ "--stat-color": st.color } as CSSProperties}>
            <div className="stat__label">{st.label}</div>
            <div className="stat__value">{st.value}</div>
          </div>
        ))}
      </div>

      {s.readings.length === 0 ? (
        <EmptyState title="בסשן הזה לא נשמרו מדידות">כדי למדוד קשב צריך להפעיל את המצלמה במהלך הסשן.</EmptyState>
      ) : (
        <div className="card table-wrap">
          <table className="responsive-table">
            <thead><tr><th>זמן</th><th>מיקום בתוכן</th><th>ציון קשב (0–1)</th></tr></thead>
            <tbody>
              {s.readings.map((r, i) => (
                <tr key={i}>
                  <td data-label="זמן">{fmtDate(r.created_at)}</td>
                  <td data-label="מיקום">{r.position}</td>
                  <td data-label="ציון">{fmtScore(r.score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
