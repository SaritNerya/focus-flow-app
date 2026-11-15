/** חישוב קווי הגובה של הרקע — פונקציות טהורות, בלי DOM. */

export interface Peak {
  rings: number;
  r0: number;
  seedOffset: number;
  center: (w: number, h: number) => [number, number];
}

export const PEAKS: Peak[] = [
  { rings: 22, r0: 22, seedOffset: 0, center: (w, h) => [w * 0.2, h * 0.3] },   // ראשית: שליש עליון, שמאל
  { rings: 9, r0: 14, seedOffset: 7.3, center: (w, h) => [w * 0.86, h * 0.9] },  // משנית: הפינה התחתונה הנגדית
];

const POINTS = 64;
const STEP = 24;
const STRETCH_X = 1.25;

/** קו ראשי: כל טבעת חמישית. */
export const isMajor = (ring: number) => ring % 5 === 4;

/** path סגור וחלק (עקומות ריבועיות דרך נקודות האמצע) של טבעת אחת. */
export function ringPath(cx: number, cy: number, ring: number, peak: Peak, t: number): string {
  const seed = ring * 0.35 + peak.seedOffset;
  const r = peak.r0 + ring * STEP;
  const pts: [number, number][] = [];
  for (let k = 0; k < POINTS; k++) {
    const a = (k / POINTS) * Math.PI * 2;
    const n = Math.sin(a * 3 + seed + t) * 0.09 + Math.sin(a * 5 - seed * 1.3 + t * 0.7) * 0.05 + Math.sin(a * 2 + seed * 2) * 0.12;
    const rr = r * (1 + n);
    pts.push([cx + Math.cos(a) * rr * STRETCH_X, cy + Math.sin(a) * rr]);
  }
  const mid = (p: [number, number], q: [number, number]) => `${((p[0] + q[0]) / 2).toFixed(1)},${((p[1] + q[1]) / 2).toFixed(1)}`;
  let d = `M${mid(pts[POINTS - 1], pts[0])}`;
  for (let k = 0; k < POINTS; k++) {
    const p = pts[k];
    d += ` Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${mid(p, pts[(k + 1) % POINTS])}`;
  }
  return `${d} Z`;
}
