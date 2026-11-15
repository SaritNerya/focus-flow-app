import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import { topoModeFor } from "./topoConfig";
import { isMajor, PEAKS, ringPath } from "./topoPaths";

const FRAME_MS = 1000 / 30;          // עד 30 פריימים בשנייה
const TIME_SCALE = 4000;             // t = זמן / 4000
const DRAW_MS = 900;                 // אנימציית הכניסה של כל טבעת
const DRAW_STAGGER_MS = 25;
const MAX_RINGS = Math.max(...PEAKS.map((p) => p.rings));

const RINGS = PEAKS.flatMap((peak) => Array.from({ length: peak.rings }, (_, ring) => ({ peak, ring })));

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const prefersReducedMotion = () => window.matchMedia(REDUCE_QUERY).matches;

/**
 * רקע קווי הגובה: SVG קבוע מאחורי כל האתר, דקורטיבי בלבד.
 * ה-`d` של כל טבעת מתעדכן ישירות דרך refs (בלי רינדור של React בכל פריים).
 * הלולאה רצה רק בנתיב מונפש, רק כשהלשונית גלויה, ולא כשהמשתמש ביקש פחות תנועה.
 */
export default function TopoBackground() {
  const { intensity, animated } = topoModeFor(useLocation().pathname);
  const [reduce, setReduce] = useState(prefersReducedMotion);
  // ציור הקווים בכניסה — רק בטעינה הראשונה של העמוד (הרכיב מותקן פעם אחת) ולא בנתיב סטטי
  const [drawing, setDrawing] = useState(() => animated && !prefersReducedMotion());
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const t = useRef(0);

  const draw = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    RINGS.forEach(({ peak, ring }, i) => {
      const [cx, cy] = peak.center(w, h);
      paths.current[i]?.setAttribute("d", ringPath(cx, cy, ring, peak, t.current));
    });
  }, []);

  useLayoutEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  useEffect(() => {
    const mq = window.matchMedia(REDUCE_QUERY);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!drawing) return;
    const id = window.setTimeout(() => setDrawing(false), DRAW_MS + DRAW_STAGGER_MS * MAX_RINGS);
    return () => window.clearTimeout(id);
  }, [drawing]);

  useEffect(() => {
    if (!animated || reduce) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (last && now - last < FRAME_MS) return;
      if (last) t.current += (now - last) / TIME_SCALE;
      last = now;
      draw();
    };
    const start = () => {
      if (raf || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [animated, reduce, draw]);

  return (
    <svg className={`topo ${drawing ? "topo--draw" : ""}`} aria-hidden="true" focusable="false">
      {RINGS.map(({ ring }, i) => {
        const major = isMajor(ring);
        return (
          <path
            key={i}
            ref={(el) => { paths.current[i] = el; }}
            pathLength={1}
            strokeWidth={major ? 1.6 : 1}
            strokeOpacity={(major ? 0.55 : 0.22) * intensity}
            style={{ "--ring": ring } as CSSProperties}
          />
        );
      })}
    </svg>
  );
}
