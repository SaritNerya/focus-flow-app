import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import { CONTENT_TYPES } from "../contentTypes";
import Loader from "../components/Loader";
import NotFound from "../components/NotFound";
import PageHeader from "../components/PageHeader";
import SessionPanel from "../components/SessionPanel";
import Shape from "../components/Shape";
import YouTubePlayer from "../components/YouTubePlayer";
import type { ContentItem } from "../types";

export default function ContentPage() {
  const { id } = useParams();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "error">("loading");

  // כל סוג תוכן מגדיר כאן איך מחשבים "מיקום בתוכן" (שנייה בסרטון / אחוז גלילה בטקסט)
  const positionRef = useRef<() => number | null>(() => null);
  const readerRef = useRef<HTMLElement>(null);
  // בדף אינטרנט שמותר להטמיע: "page" = הדף המקורי, "reader" = תצוגת קריאה (הטקסט שחולץ)
  const [view, setView] = useState<"page" | "reader">("page");

  useEffect(() => {
    setState("loading");
    api<ContentItem>(`/api/content/${id}`)
      .then((d) => { setItem(d); setView(d.embed_url ? "page" : "reader"); setState("ok"); })
      .catch((e: ApiError) => setState(e.status === 404 ? "missing" : "error"));
  }, [id]);

  // מיקום בתוכן = אחוז הגלילה בתצוגת הקריאה. בדף המקורי (מאתר אחר) אי אפשר לקרוא את הגלילה,
  // ולכן null — ואז הסשן שומר את הזמן מתחילת הסשן במקום.
  useEffect(() => {
    if (!item || item.type === "youtube" || view === "page") return;
    positionRef.current = () => {
      const el = readerRef.current;
      if (!el) return null;
      const max = el.scrollHeight - el.clientHeight;
      return max > 0 ? Number((el.scrollTop / max).toFixed(3)) : 0; // 0..1
    };
    return () => { positionRef.current = () => null; };
  }, [item, view]);

  if (state === "loading") return <Loader />;
  if (state === "missing") return <NotFound what="הפריט" />;
  if (state === "error" || !item) return <p className="error" role="alert">לא הצלחנו לטעון את הפריט. נסו לרענן.</p>;

  const info = CONTENT_TYPES[item.type];
  return (
    <>
      <PageHeader
        title={item.title}
        compact
        caption={<span className="caption-symbol"><Shape kind={info.shape} color={info.color} />{info.label}</span>}
        back={{ to: "/library", label: "חזרה לספרייה" }}
      />
      <div className="content-layout">
        <section className="card viewer" aria-label="תצוגת התוכן">
          {item.type === "youtube" && item.youtube_id && (
            <YouTubePlayer videoId={item.youtube_id} title={item.title} positionRef={positionRef} />
          )}
          {/* טקסט מוצג כטקסט רגיל (לא כ-HTML) - הגנה מפני XSS */}
          {item.embed_url && (
            <div className="view-tabs" role="group" aria-label="אופן התצוגה">
              <button type="button" aria-pressed={view === "page"} onClick={() => setView("page")}>הדף המקורי</button>
              <button type="button" aria-pressed={view === "reader"} onClick={() => setView("reader")}>תצוגת קריאה</button>
            </div>
          )}
          {item.embed_url && view === "page" ? (
            <div className="web-frame">
              {/* sandbox: הדף רץ בבידוד — בלי גישה לאתר שלנו ובלי אפשרות לנווט את החלון הראשי */}
              <iframe src={item.embed_url} title={item.title} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="no-referrer" loading="lazy" />
            </div>
          ) : (
            item.type !== "youtube" && <article className="reader" dir="auto" ref={readerRef}>{item.text}</article>
          )}
          {item.type === "web" && (
            <p className="muted source-line">
              מקור: <a href={item.source} target="_blank" rel="noopener noreferrer" dir="ltr">{item.source}</a>
              {item.embed_url && view === "page" && " · הדף לא נטען? עברו ל\"תצוגת קריאה\"."}
              {!item.embed_url && " · האתר לא מאפשר להציג את הדף המקורי בתוך FocusFlow, לכן מוצג הטקסט שלו."}
            </p>
          )}
        </section>
        <SessionPanel contentId={item.id} getPosition={() => positionRef.current()} />
      </div>
    </>
  );
}
