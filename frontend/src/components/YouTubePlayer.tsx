// import { useEffect, useRef, useState, type MutableRefObject } from "react";

// /* eslint-disable @typescript-eslint/no-explicit-any */
// declare global {
//   interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void }
// }

// let apiPromise: Promise<void> | null = null;
// function loadYouTubeApi(): Promise<void> {
//   if (window.YT?.Player) return Promise.resolve();
//   if (!apiPromise) {
//     apiPromise = new Promise<void>((resolve, reject) => {
//       const prev = window.onYouTubeIframeAPIReady;
//       window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
//       const s = document.createElement("script");
//       s.src = "https://www.youtube.com/iframe_api";
//       s.onerror = () => { apiPromise = null; reject(new Error("youtube api")); };
//       document.head.appendChild(s);
//     });
//   }
//   return apiPromise;
// }

// /**
//  * נגן YouTube עם IFrame API, כדי לדעת באיזו שנייה הצופה נמצא.
//  * positionRef.current() מחזיר את השנייה הנוכחית (או null אם הנגן לא מוכן).
//  */
// export default function YouTubePlayer({ videoId, title, positionRef }: {
//   videoId: string; title: string; positionRef: MutableRefObject<() => number | null>;
// }) {
//   const holder = useRef<HTMLDivElement>(null);
//   const [fallback, setFallback] = useState(false);

//   useEffect(() => {
//     let player: any;
//     let cancelled = false;
//     loadYouTubeApi()
//       .then(() => {
//         if (cancelled || !holder.current) return;
//         holder.current.innerHTML = "";
//         const el = document.createElement("div");
//         holder.current.appendChild(el);
//         player = new window.YT.Player(el, {
//           videoId,
//           host: "https://www.youtube-nocookie.com",
//           width: "100%",
//           height: "100%",
//           playerVars: { rel: 0, origin: window.location.origin },
//           events: {
//             onReady: () => {
//               positionRef.current = () =>
//                 typeof player?.getCurrentTime === "function" ? Number(player.getCurrentTime().toFixed(1)) : null;
//             },
//           },
//         });
//       })
//       .catch(() => setFallback(true)); // ה-API נחסם: נגן רגיל, והמיקום ייגזר מזמן הסשן
//     return () => {
//       cancelled = true;
//       positionRef.current = () => null;
//       try { player?.destroy(); } catch { /* ignore */ }
//     };
//   }, [videoId, positionRef]);

//   if (fallback) {
//     return (
//       <div className="video-wrap">
//         <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={title}
//           allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
//       </div>
//     );
//   }
//   return <div className="video-wrap" ref={holder} aria-label={title} />;
// }
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { LOW_FOCUS_THRESHOLD, WINDOW_SECONDS } from "../attention/config";
import type { AttentionController } from "../attention/controller";

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
  const [saveWarning, setSaveWarning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const ctrlRef = useRef<AttentionController | null>(null);
  const sessionRef = useRef<string | null>(null);
  const startedAt = useRef(0);
  const getPositionRef = useRef(getPosition);
  getPositionRef.current = getPosition;

  // ניקוי ביציאה מהעמוד: מכבים מצלמה וסוגרים סשן פתוח
  useEffect(() => () => {
    ctrlRef.current?.stop();
    if (sessionRef.current) void api(`/api/sessions/${sessionRef.current}/end`, { method: "POST" }).catch(() => {});
  }, []);

  async function start() {
    setBusy(true);
    setError("");
    try {
      const s = await api<{ id: string }>("/api/sessions", { method: "POST", body: { content_id: contentId } });
      sessionRef.current = s.id;
      startedAt.current = Date.now();
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
      onScore: (p) => {
        setScore(p.score);
        const sid = sessionRef.current;
        if (!sid) return;
        const position = getPositionRef.current() ?? Number(((Date.now() - startedAt.current) / 1000).toFixed(1));
        api(`/api/sessions/${sid}/readings`, { method: "POST", body: { position, score: p.score } })
          .then(() => setSaveWarning(false))
          .catch(() => setSaveWarning(true));
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
    } catch {
      ctrl.stop();
      setCamera("error");
      setCameraMsg("לא הצלחנו לטעון את מודל הקשב. אפשר להמשיך לצפות בלי מדידה.");
    }
  }

  function disableCamera() {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    setCamera("off");
    setScore(null);
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
    <section className="card" aria-labelledby="session-h">
      <h2 id="session-h">סשן קשב</h2>

      {!sessionId ? (
        <>
          <p className="muted">בסשן אפשר למדוד את רמת הקשב שלכם בזמן הצפייה או הקריאה, דרך המצלמה.</p>
          <button className="btn" onClick={start} disabled={busy}>{busy ? "פותח…" : "התחלת סשן"}</button>
        </>
      ) : (
        <>
          <p className="success" role="status">הסשן פעיל.</p>

          {(camera === "off" || camera === "denied" || camera === "error") && (
            <div className="consent">
              <h3>מדידת קשב במצלמה</h3>
              <ul>
                <li>המצלמה תידלק רק אחרי שתלחצו על הכפתור ותאשרו בדפדפן.</li>
                <li>הווידאו לא עוזב את המכשיר שלכם ולא נשמר.</li>
                <li>הדפדפן מחשב מהתמונה נקודות פנים, ומהן ציון קשב. רק הציון (מספר בין 0 ל-1) נשלח לשרת ונשמר.</li>
              </ul>
              <button className="btn" onClick={enableCamera}>
                {camera === "off" ? "הפעלת מצלמה ומדידת קשב" : "ניסיון נוסף"}
              </button>
              {cameraMsg && <p className="error" role="alert">{cameraMsg}</p>}
            </div>
          )}

          {camera === "asking" && <p role="status">ממתינים לאישור המצלמה בדפדפן…</p>}
          {camera === "loading" && <p role="status">טוענים את מודל הקשב, זה לוקח כמה שניות…</p>}

          <video ref={videoRef} className={`preview ${measuring || camera === "loading" ? "" : "hidden"}`} muted playsInline aria-label="תצוגה מקדימה של המצלמה" />

          {measuring && (
            <div className="score-box">
              <div className="score-label">ציון קשב אחרון (בין 0 ל-1, גבוה = קשוב יותר)</div>
              <div className={`score-value ${low ? "low" : ""}`} aria-live="polite">{score === null ? "—" : score.toFixed(2)}</div>
              <div className="bar" aria-hidden="true"><div className={low ? "low" : ""} style={{ width: `${Math.round((score ?? 0) * 100)}%` }} /></div>

              {!faceFound && <p className="warn" role="alert">לא זוהו פנים. ודאו שהפנים שלכם נראים במצלמה.</p>}
              {faceFound && score === null && <p className="muted" role="status">אוספים נתונים… הציון הראשון יופיע בעוד כ-{secondsLeft} שניות.</p>}
              {faceFound && score !== null && <p className="muted">הציון מתעדכן כל כמה שניות.</p>}
              {low && <p className="alert-box" role="alert">⚠ הקשב שלכם ירד. אולי כדאי לקחת הפסקה קצרה או לחזור לקטע שהחמצתם.</p>}
              {saveWarning && <p className="warn">שמירת הציון בשרת נכשלה. ננסה שוב בציון הבא.</p>}
              {cameraMsg && <p className="warn">{cameraMsg}</p>}
              <button className="btn secondary" onClick={disableCamera}>כיבוי המצלמה (בלי לסיים סשן)</button>
            </div>
          )}

          <button className="btn danger end-btn" onClick={end} disabled={busy}>{busy ? "מסיים…" : "סיום הסשן"}</button>
        </>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
