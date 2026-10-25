import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";

/**
 * ניהול הסשן: פתיחה וסגירה מול השרת.
 * TODO (השלב הבא): כאן מתחברים הכפתור "הפעלת מצלמה", MediaPipe, חלון 100 הפריימים,
 * הרצת המודל ושליחת POST /api/sessions/{id}/readings.
 */
export default function SessionPanel({ contentId }: { contentId: string }) {
  const nav = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true);
    setError("");
    try {
      const s = await api<{ id: string }>("/api/sessions", { method: "POST", body: { content_id: contentId } });
      setSessionId(s.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "פתיחת הסשן נכשלה");
    } finally {
      setBusy(false);
    }
  }

  async function end() {
    if (!sessionId) return;
    setBusy(true);
    try {
      await api(`/api/sessions/${sessionId}/end`, { method: "POST" });
      nav(`/history/${sessionId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "סיום הסשן נכשל");
      setBusy(false);
    }
  }

  return (
    <section className="card" aria-labelledby="session-h">
      <h2 id="session-h">סשן קשב</h2>
      {!sessionId ? (
        <>
          <p className="muted">לחצו כדי להתחיל סשן. בשלב הבא תוכלו להפעיל מצלמה כדי למדוד קשב.</p>
          <button className="btn" onClick={start} disabled={busy}>{busy ? "פותח…" : "התחלת סשן"}</button>
        </>
      ) : (
        <>
          <p className="success" role="status">הסשן פעיל.</p>
          <button className="btn danger" onClick={end} disabled={busy}>{busy ? "מסיים…" : "סיום הסשן"}</button>
        </>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
