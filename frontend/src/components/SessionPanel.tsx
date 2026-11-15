import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError, getToken } from "../api";
import { LOW_FOCUS_THRESHOLD, WINDOW_SECONDS } from "../attention/config";
import type { AttentionController } from "../attention/controller";
import { API_URL } from "../config";
import { ReadingQueue } from "../readingQueue";
import CountUp from "./CountUp";

type Camera = "off" | "asking" | "loading" | "on" | "denied" | "error";

export default function SessionPanel({ contentId, getPosition }: { contentId: string; getPosition: () => number | null }) {
  const nav = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [camera, setCamera] = useState<Camera>("off");
  const [cameraMsg, setCameraMsg] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [faceFound, setFaceFound] = useState(true);
  const [fill, setFill] = useState(0);
  const [saveWarning, setSaveWarning] = useState("");
  // השרת החזיר 409 למדידה: הסשן נסגר או הגיע למגבלת המדידות — לא מודדים יותר
  const [sessionClosed, setSessionClosed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const ctrlRef = useRef<AttentionController | null>(null);
  const sessionRef = useRef<string | null>(null);
  const queueRef = useRef<ReadingQueue | null>(null);
  const startedAt = useRef(0);
  const getPositionRef = useRef(getPosition);
  getPositionRef.current = getPosition;

  // ניקוי במעבר לעמוד אחר באתר: מכבים מצלמה וסוגרים סשן פתוח
  useEffect(() => () => {
    ctrlRef.current?.stop();
    queueRef.current?.stop();
    if (sessionRef.current) void api(`/api/sessions/${sessionRef.current}/end`, { method: "POST" }).catch(() => {});
  }, []);

  // סגירת הלשונית או הדף: React לא מספיק לנקות, ולכן שולחים סיום עם keepalive (הבקשה ממשיכה גם אחרי שהדף נסגר)
  useEffect(() => {
    const onPageHide = () => {
      const sid = sessionRef.current;
      const token = getToken();
      if (!sid || !token) return;
      sessionRef.current = null; // כדי שהניקוי ב-unmount לא ישלח שוב
      ctrlRef.current?.stop();
      queueRef.current?.stop();
      void fetch(`${API_URL}/api/sessions/${sid}/end`, {
        method: "POST",
        keepalive: true,
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  function stopMeasuring() {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    setCamera("off");
    setScore(null);
  }

  async function start() {
    setBusy(true);
    setError("");
    try {
      const s = await api<{ id: string }>("/api/sessions", { method: "POST", body: { content_id: contentId } });
      sessionRef.current = s.id;
      startedAt.current = Date.now();
      // מדידה שנכשלה נשלחת שוב (עד 3 פעמים); 409 = הסשן נסגר או מלא — מפסיקים למדוד
      queueRef.current = new ReadingQueue(
        (reading) => api(`/api/sessions/${s.id}/readings`, { method: "POST", body: reading }),
        {
          onSaved: (pending) => { if (pending === 0) setSaveWarning(""); },
          onRetrying: () => setSaveWarning("שמירת הציון בשרת נכשלה. מנסים שוב…"),
          onDropped: () => setSaveWarning("חלק מהציונים לא נשמרו בשרת."),
          onClosed: () => {
            setSessionClosed(true);
            setSaveWarning("");
            stopMeasuring();
          },
        },
      );
      setSessionId(s.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "פתיחת הסשן נכשלה");
    } finally {
      setBusy(false);
    }
  }

  async function enableCamera() {
    setCameraMsg("");
    setScore(null);
    setFill(0);
    setFaceFound(true);
    setCamera("asking"); // הדפדפן מבקש כעת אישור מהמשתמש
    const { AttentionController } = await import("../attention/controller"); // נטען רק כשצריך
    const ctrl = new AttentionController({
      onFrame: (found, f) => { setFaceFound(found); setFill(f); },
      onWindowReset: () => setScore(null), // הציון הקודם כבר לא תקף — ממתינים לציון חדש
      onScore: (p) => {
        setScore(p.score);
        if (!sessionRef.current) return;
        const position = getPositionRef.current() ?? Number(((Date.now() - startedAt.current) / 1000).toFixed(1));
        queueRef.current?.add({ position, score: p.score });
      },
      onError: (m) => setCameraMsg(m),
    });
    ctrlRef.current = ctrl;
    try {
      await ctrl.startCamera(videoRef.current!);
    } catch (e) {
      const name = (e as DOMException).name;
      ctrl.stop();
      if (name === "NotAllowedError" || name === "SecurityError") {
        setCamera("denied");
        setCameraMsg("לא אישרתם גישה למצלמה, ולכן הקשב לא נמדד. אפשר להמשיך לצפות בלי מדידה, או לאפשר גישה בהגדרות הדפדפן ולנסות שוב.");
      } else {
        setCamera("error");
        setCameraMsg("לא נמצאה מצלמה זמינה במכשיר. אפשר להמשיך לצפות בלי מדידה.");
      }
      return;
    }
    setCamera("loading");
    try {
      await ctrl.startMeasuring();
      setCamera("on");
    } catch (e) {
      console.error("startMeasuring failed:", e);
      ctrl.stop();
      setCamera("error");
      setCameraMsg("לא הצלחנו לטעון את מודל הקשב. אפשר להמשיך לצפות בלי מדידה.");
    }
  }

  async function end() {
    if (!sessionId) return;
    setBusy(true);
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    try {
      await api(`/api/sessions/${sessionId}/end`, { method: "POST" });
      sessionRef.current = null;
      nav(`/history/${sessionId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "סיום הסשן נכשל");
      setBusy(false);
    }
  }

  const measuring = camera === "on";
  const low = measuring && faceFound && score !== null && score < LOW_FOCUS_THRESHOLD;
  const secondsLeft = Math.ceil((1 - fill) * WINDOW_SECONDS);

  return (
    <section className="card session-panel" aria-labelledby="session-h">
      <h2 id="session-h">סשן קשב</h2>

      {!sessionId ? (
        <>
          <p className="muted">בסשן אפשר למדוד את רמת הקשב שלכם בזמן הצפייה או הקריאה, דרך המצלמה.</p>
          <button className="btn block" onClick={start} disabled={busy}>{busy ? "פותח…" : "התחלת סשן"}</button>
        </>
      ) : (
        <>
          {/* סיום הסשן בראש הפאנל — תמיד גלוי, בלי לגלול */}
          <div className="session-bar">
            <p className="live-pill" role="status">הסשן פעיל</p>
            <button className="btn secondary small" onClick={end} disabled={busy}>{busy ? "מסיים…" : "סיום הסשן"}</button>
          </div>

          {sessionClosed && <p className="notice warn" role="alert">הסשן הסתיים או הגיע למגבלת המדידות</p>}

          {!sessionClosed && (camera === "off" || camera === "denied" || camera === "error") && (
            <div className="consent">
              <h3>מדידת קשב במצלמה</h3>
              <ul>
                <li>המצלמה תידלק רק אחרי שתלחצו על הכפתור ותאשרו בדפדפן.</li>
                <li>הווידאו לא עוזב את המכשיר שלכם ולא נשמר.</li>
                <li>הדפדפן מחשב מהתמונה נקודות פנים, ומהן ציון קשב. רק הציון (מספר בין 0 ל-1) נשלח לשרת ונשמר.</li>
              </ul>
              <button className="btn block" onClick={enableCamera}>
                {camera === "off" ? "הפעלת מצלמה ומדידת קשב" : "ניסיון נוסף"}
              </button>
              {cameraMsg && <p className="error" role="alert">{cameraMsg}</p>}
            </div>
          )}

          {camera === "asking" && <p role="status">ממתינים לאישור המצלמה בדפדפן…</p>}
          {camera === "loading" && <p role="status">טוענים את מודל הקשב, זה לוקח כמה שניות…</p>}

          {/* תצוגת המצלמה והציון זו לצד זו — כדי שכל הפאנל ייכנס למסך בלי לגלול */}
          <div className={`measure ${measuring ? "measuring" : ""}`}>
            <video ref={videoRef} className={`preview ${measuring || camera === "loading" ? "" : "hidden"}`} muted playsInline aria-label="תצוגה מקדימה של המצלמה" />
            {measuring && (
              <div className="score-box">
                <div className="score-label">ציון קשב אחרון (בין 0 ל-1, גבוה = קשוב יותר)</div>
                <div className={`score-value ${low ? "low" : ""}`} aria-live="polite">
                  {score === null ? <span className="score-waiting">ממתין לציון...</span> : <CountUp value={score} decimals={2} />}
                </div>
                <div className="bar" aria-hidden="true">
                  <div className="bar__track"><div className={`bar__fill ${low ? "low" : ""}`} style={{ width: `${Math.round((score ?? 0) * 100)}%` }} /></div>
                  <div className="bar__scale mono">
                    <span>0</span>
                    <span className="bar__threshold" style={{ insetInlineStart: `${LOW_FOCUS_THRESHOLD * 100}%` }}>{LOW_FOCUS_THRESHOLD}</span>
                    <span>1</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {measuring && (
            <div className="measure-status">
              {!faceFound && <p className="notice warn" role="alert">לא זוהו פנים. ודאו שהפנים שלכם נראים במצלמה.</p>}
              {faceFound && score === null && <p className="muted" role="status">אוספים נתונים… הציון יופיע בעוד כ-{secondsLeft} שניות.</p>}
              {faceFound && score !== null && <p className="muted">הציון מתעדכן כל כמה שניות.</p>}
              {low && <p className="notice alert" role="alert">הקשב שלכם ירד. אולי כדאי לקחת הפסקה קצרה או לחזור לקטע שהחמצתם.</p>}
              {saveWarning && <p className="notice warn" role="status">{saveWarning}</p>}
              {cameraMsg && <p className="notice warn">{cameraMsg}</p>}
              <button className="btn secondary small block" onClick={stopMeasuring}>כיבוי המצלמה (בלי לסיים סשן)</button>
            </div>
          )}
        </>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
