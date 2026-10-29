import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import NotFound from "../components/NotFound";
import SessionPanel from "../components/SessionPanel";
import YouTubePlayer from "../components/YouTubePlayer";
import type { ContentItem } from "../types";

export default function ContentPage() {
  const { id } = useParams();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "error">("loading");

  // כל סוג תוכן מגדיר כאן איך מחשבים "מיקום בתוכן" (שנייה בסרטון / אחוז גלילה בטקסט)
  const positionRef = useRef<() => number | null>(() => null);
  const readerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setState("loading");
    api<ContentItem>(`/api/content/${id}`)
      .then((d) => { setItem(d); setState("ok"); })
      .catch((e: ApiError) => setState(e.status === 404 ? "missing" : "error"));
  }, [id]);

  useEffect(() => {
    if (!item || item.type === "youtube") return;
    positionRef.current = () => {
      const el = readerRef.current;
      if (!el) return null;
      const max = el.scrollHeight - el.clientHeight;
      return max > 0 ? Number((el.scrollTop / max).toFixed(3)) : 0; // 0..1
    };
    return () => { positionRef.current = () => null; };
  }, [item]);

  if (state === "loading") return <p className="muted">טוען…</p>;
  if (state === "missing") return <NotFound what="הפריט" />;
  if (state === "error" || !item) return <p className="error" role="alert">לא הצלחנו לטעון את הפריט. נסו לרענן.</p>;

  return (
    <>
      <p><Link to="/">← חזרה לספרייה</Link></p>
      <h1>{item.title}</h1>
      <div className="grid wide-left">
        <section className="card viewer" aria-label="תצוגת התוכן">
          {item.type === "youtube" && item.youtube_id && (
            <YouTubePlayer videoId={item.youtube_id} title={item.title} positionRef={positionRef} />
          )}
          {/* טקסט מוצג כטקסט רגיל (לא כ-HTML) - הגנה מפני XSS */}
          {item.type !== "youtube" && <article className="reader" dir="auto" ref={readerRef}>{item.text}</article>}
          {item.type === "web" && <p className="muted">מקור: <a href={item.source} target="_blank" rel="noopener noreferrer" dir="ltr">{item.source}</a></p>}
        </section>
        <SessionPanel contentId={item.id} getPosition={() => positionRef.current()} />
      </div>
    </>
  );
}
