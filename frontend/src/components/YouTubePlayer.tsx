import { useEffect, useRef, useState, type MutableRefObject } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void }
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise<void>((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.onerror = () => { apiPromise = null; reject(new Error("youtube api")); };
      document.head.appendChild(s);
    });
  }
  return apiPromise;
}

/**
 * נגן YouTube עם IFrame API, כדי לדעת באיזו שנייה הצופה נמצא.
 * positionRef.current() מחזיר את השנייה הנוכחית (או null אם הנגן לא מוכן).
 */
export default function YouTubePlayer({ videoId, title, positionRef }: {
  videoId: string; title: string; positionRef: MutableRefObject<() => number | null>;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let player: any;
    let cancelled = false;
    loadYouTubeApi()
      .then(() => {
        if (cancelled || !holder.current) return;
        holder.current.innerHTML = "";
        const el = document.createElement("div");
        holder.current.appendChild(el);
        player = new window.YT.Player(el, {
          videoId,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { rel: 0, origin: window.location.origin },
          events: {
            onReady: () => {
              positionRef.current = () =>
                typeof player?.getCurrentTime === "function" ? Number(player.getCurrentTime().toFixed(1)) : null;
            },
          },
        });
      })
      .catch(() => setFallback(true)); // ה-API נחסם: נגן רגיל, והמיקום ייגזר מזמן הסשן
    return () => {
      cancelled = true;
      positionRef.current = () => null;
      try { player?.destroy(); } catch { /* ignore */ }
    };
  }, [videoId, positionRef]);

  if (fallback) {
    return (
      <div className="video-wrap">
        <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={title}
          allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  return <div className="video-wrap" ref={holder} aria-label={title} />;
}
