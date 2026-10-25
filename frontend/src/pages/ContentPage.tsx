import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import NotFound from "../components/NotFound";
import SessionPanel from "../components/SessionPanel";
import type { ContentItem } from "../types";

export default function ContentPage() {
  const { id } = useParams();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "error">("loading");

  useEffect(() => {
    setState("loading");
    api<ContentItem>(`/api/content/${id}`)
      .then((d) => { setItem(d); setState("ok"); })
      .catch((e: ApiError) => setState(e.status === 404 ? "missing" : "error"));
  }, [id]);

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
            <div className="video-wrap">
              <iframe src={`https://www.youtube-nocookie.com/embed/${item.youtube_id}`} title={item.title}
                allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          )}
          {/* טקסט מוצג כטקסט רגיל (לא כ-HTML) - הגנה מפני XSS */}
          {item.type !== "youtube" && <article className="reader" dir="auto">{item.text}</article>}
          {item.type === "web" && <p className="muted">מקור: <a href={item.source} target="_blank" rel="noopener noreferrer" dir="ltr">{item.source}</a></p>}
        </section>
        <SessionPanel contentId={item.id} />
      </div>
    </>
  );
}
