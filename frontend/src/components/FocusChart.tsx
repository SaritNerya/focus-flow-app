import { LOW_FOCUS_THRESHOLD } from "../attention/config";
import type { ScoredSession } from "../homeStats";
import { fmtDate, fmtScore, isLowScore } from "../pages/History";

// מידות ה-viewBox. ה-SVG נמתח לרוחב הכרטיס; בטלפון יש רוחב מינימלי וגלילה אופקית.
const W = 640, H = 240;
const M = { top: 20, right: 20, bottom: 36, left: 44 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1];

const y = (v: number) => M.top + (1 - Math.min(1, Math.max(0, v))) * PLOT_H;
const fmtShortDay = (s: string) => new Date(s).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });

/**
 * גרף קווי של הציון הממוצע בסשנים האחרונים (מהישן לחדש, משמאל לימין).
 * קו מקווקו מסמן את סף ההתראה (LOW_FOCUS_THRESHOLD). לכל נקודה tooltip (title) עם התאריך והציון,
 * וכל הנתונים מופיעים גם בתיאור הטקסטואלי של הגרף לקוראי מסך.
 */
export default function FocusChart({ sessions }: { sessions: ScoredSession[] }) {
  const n = sessions.length;
  const x = (i: number) => M.left + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W);
  const points = sessions.map((s, i) => ({ s, cx: x(i), cy: y(s.average_score), low: isLowScore(s.average_score) }));
  const description =
    `גרף הציון הממוצע ב-${n} הסשנים האחרונים, מהישן לחדש. סף ההתראה: ${LOW_FOCUS_THRESHOLD}. ` +
    points.map((p) => `${fmtDate(p.s.started_at)}: ${fmtScore(p.s.average_score)}${p.low ? " (מתחת לסף)" : ""}`).join("; ");

  return (
    <div className="chart-scroll">
      <svg className="focus-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={description}>
        {/* ציר Y: קווי רשת ותוויות */}
        {Y_TICKS.map((t) => (
          <g key={t}>
            <line className="focus-chart__grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
            <text className="focus-chart__tick" x={M.left - 8} y={y(t)} dy="0.35em" textAnchor="end">{t.toFixed(2)}</text>
          </g>
        ))}

        {/* סף ההתראה */}
        <line className="focus-chart__threshold" x1={M.left} x2={W - M.right} y1={y(LOW_FOCUS_THRESHOLD)} y2={y(LOW_FOCUS_THRESHOLD)} />
        <text className="focus-chart__threshold-label" x={W - M.right} y={y(LOW_FOCUS_THRESHOLD) - 6} textAnchor="end">
          סף ההתראה ({LOW_FOCUS_THRESHOLD})
        </text>

        {/* ציר X */}
        <line className="focus-chart__axis" x1={M.left} x2={W - M.right} y1={M.top + PLOT_H} y2={M.top + PLOT_H} />
        {points.map((p) => (
          <text key={p.s.id} className="focus-chart__tick" x={p.cx} y={H - M.bottom + 20} textAnchor="middle">{fmtShortDay(p.s.started_at)}</text>
        ))}

        {/* הקו והנקודות */}
        {n > 1 && <polyline className="focus-chart__line" points={points.map((p) => `${p.cx},${p.cy}`).join(" ")} />}
        {points.map((p) => (
          <g key={p.s.id} className="focus-chart__point">
            <title>{`${fmtDate(p.s.started_at)} · ${p.s.content_title ?? "פריט שנמחק"}\nציון ממוצע: ${fmtScore(p.s.average_score)}${p.low ? " (מתחת לסף)" : ""}`}</title>
            <circle className="focus-chart__hit" cx={p.cx} cy={p.cy} r={14} />
            <circle className={`focus-chart__dot ${p.low ? "low" : ""}`} cx={p.cx} cy={p.cy} r={6} />
          </g>
        ))}
      </svg>
    </div>
  );
}
