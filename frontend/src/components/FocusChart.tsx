import { LOW_FOCUS_THRESHOLD } from "../attention/config";
import type { ScoredSession } from "../homeStats";
import { fmtDate, fmtScore, isLowScore } from "../pages/History";

// מידות ה-viewBox. ה-SVG נמתח לרוחב הכרטיס; בטלפון יש רוחב מינימלי וגלילה אופקית.
const W = 640, H = 240;
const M = { top: 20, right: 20, bottom: 36, left: 44 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;
const Y_TICKS = [0, 0.5, 1];

const y = (v: number) => M.top + (1 - Math.min(1, Math.max(0, v))) * PLOT_H;
const fmtShortDay = (s: string) => new Date(s).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });

/**
 * "חתך המסלול": הציון הממוצע בסשנים האחרונים כקו רכס (מהישן לחדש, משמאל לימין), בלי רשת.
 * קו מקווקו מסמן את סף ההתראה (LOW_FOCUS_THRESHOLD). המטפס עומד על הנקודה האחרונה.
 * לכל נקודה tooltip (title) עם התאריך והציון, וכל הנתונים מופיעים גם בתיאור הטקסטואלי לקוראי מסך.
 */
export default function FocusChart({ sessions }: { sessions: ScoredSession[] }) {
  const n = sessions.length;
  const x = (i: number) => M.left + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W);
  const points = sessions.map((s, i) => ({ s, cx: x(i), cy: y(s.average_score), low: isLowScore(s.average_score) }));
  const last = points[n - 1];
  const baseline = M.top + PLOT_H;
  const ridge = points.map((p) => `${p.cx},${p.cy}`).join(" L");
  const description =
    `גרף הציון הממוצע ב-${n} הסשנים האחרונים, מהישן לחדש. סף ההתראה: ${LOW_FOCUS_THRESHOLD}. ` +
    points.map((p) => `${fmtDate(p.s.started_at)}: ${fmtScore(p.s.average_score)}${p.low ? " (מתחת לסף)" : ""}`).join("; ");

  return (
    <div className="chart-scroll">
      <svg className="focus-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={description}>
        {/* ציר Y מינימלי: תוויות בלבד */}
        {Y_TICKS.map((t) => (
          <text key={t} className="focus-chart__tick" x={M.left - 10} y={y(t)} dy="0.35em" textAnchor="end">{t.toFixed(1)}</text>
        ))}

        {/* סף ההתראה */}
        <line className="focus-chart__threshold" x1={M.left} x2={W - M.right} y1={y(LOW_FOCUS_THRESHOLD)} y2={y(LOW_FOCUS_THRESHOLD)} />
        <text className="focus-chart__threshold-label" x={W - M.right} y={y(LOW_FOCUS_THRESHOLD) - 6} textAnchor="end">
          סף ההתראה ({LOW_FOCUS_THRESHOLD})
        </text>

        {/* ציר X: קו בסיס ותאריכים */}
        <line className="focus-chart__axis" x1={M.left} x2={W - M.right} y1={baseline} y2={baseline} />
        {points.map((p) => (
          <text key={p.s.id} className="focus-chart__tick" x={p.cx} y={H - M.bottom + 20} textAnchor="middle">{fmtShortDay(p.s.started_at)}</text>
        ))}

        {/* הרכס: שטח מתחת לקו, הקו עצמו והנקודות */}
        {n > 1 && <path className="focus-chart__terrain" d={`M${points[0].cx},${baseline} L${ridge} L${last.cx},${baseline} Z`} />}
        {n > 1 && <path className="focus-chart__line" d={`M${ridge}`} />}
        {points.map((p, i) => (
          <g key={p.s.id} className="focus-chart__point">
            <title>{`${fmtDate(p.s.started_at)} · ${p.s.content_title ?? "פריט שנמחק"}\nציון ממוצע: ${fmtScore(p.s.average_score)}${p.low ? " (מתחת לסף)" : ""}`}</title>
            <circle className="focus-chart__hit" cx={p.cx} cy={p.cy} r={14} />
            {i === n - 1 ? (
              <>
                <circle className="focus-chart__halo" cx={p.cx} cy={p.cy} r={5} />
                <circle className="focus-chart__climber" cx={p.cx} cy={p.cy} r={5} />
              </>
            ) : (
              <circle className={`focus-chart__dot ${p.low ? "low" : ""}`} cx={p.cx} cy={p.cy} r={4} />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
