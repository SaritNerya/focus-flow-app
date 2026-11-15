import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import EmptyState from "../components/EmptyState";
import Legend, { type LegendRow } from "../components/Legend";
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

  const low = isLowScore(s.average_score);
  const stats: LegendRow[] = [
    {
      shape: "triangle",
      color: low ? "var(--summit)" : "var(--moss)",
      label: "ציון קשב ממוצע",
      value: fmtScore(s.average_score),
      sub: low ? "מתחת לסף ההתראה" : undefined,
    },
    { shape: "circle", color: "var(--lake)", label: "מדידות", value: s.reading_count },
    { shape: "square", color: "var(--ochre)", label: "התחיל", value: fmtDate(s.started_at) },
  ];

  return (
    <>
      <PageHeader title={s.content_title ?? "פריט שנמחק"} compact caption="יומן מסע · פרטי סשן" back={{ to: "/history", label: "חזרה להיסטוריה" }} />

      <section className="card session-summary" aria-labelledby="summary-h">
        <h2 id="summary-h">סיכום</h2>
        <Legend rows={stats} />
      </section>

      {s.readings.length === 0 ? (
        <EmptyState title="בסשן הזה לא נשמרו מדידות">כדי למדוד קשב צריך להפעיל את המצלמה במהלך הסשן.</EmptyState>
      ) : (
        <div className="card table-wrap">
          <table className="responsive-table">
            <thead><tr><th>זמן</th><th>מיקום בתוכן</th><th>ציון קשב (0–1)</th></tr></thead>
            <tbody>
              {s.readings.map((r, i) => (
                <tr key={i}>
                  <td data-label="זמן" className="num">{fmtDate(r.created_at)}</td>
                  <td data-label="מיקום" className="num">{r.position}</td>
                  <td data-label="ציון" className="num">{fmtScore(r.score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
