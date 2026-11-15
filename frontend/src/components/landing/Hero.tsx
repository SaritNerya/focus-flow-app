import type { CSSProperties } from "react";
import CtaButtons from "./CtaButtons";
import { HERO } from "./content";

const RINGS = [150, 122, 96, 72, 50, 30];
// השביל עובר בדיוק דרך שלוש נקודות הציון (הקצוות של קטעי ה-S)
const TRAIL = "M30 300 C70 285 100 262 118 240 S158 206 172 192 S196 170 204 160 S222 142 230 138";
const WAYPOINTS: [number, number][] = [[118, 240], [172, 192], [204, 160]];

/**
 * מפת גובה חיה: הטבעות "נושמות", השביל המקווקו זז, קו אדום מטפס לפסגה ומדליק את נקודות הציון בדרך,
 * והפסגה פועמת. הכול ב-CSS (מושבת ב-prefers-reduced-motion). דקורטיבי בלבד.
 */
function HeroMap() {
  return (
    <svg className="hero-map" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <rect className="hero-map__bg" width="400" height="320" />
      <g className="hero-map__rings">
        {RINGS.map((r, i) => (
          <ellipse
            key={r}
            className={i % 3 === 2 ? "major" : undefined}
            cx={210 + i * 4}
            cy={150 - i * 3}
            rx={r * 1.25}
            ry={r * 0.85}
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </g>
      <path className="hero-map__trail" d={TRAIL} />
      <path className="hero-map__climb" d={TRAIL} pathLength={1} />
      {WAYPOINTS.map(([x, y], i) => (
        <circle key={x} className="hero-map__waypoint" cx={x} cy={y} r={5} style={{ "--i": i } as CSSProperties} />
      ))}
      <circle className="hero-map__halo" cx="230" cy="128" r="14" />
      <polygon className="hero-map__summit" points="230,112 244,136 216,136" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero__text">
        <p className="mono landing-eyebrow">{HERO.eyebrow}</p>
        <h1 id="landing-title">
          {HERO.titleStart}{" "}
          <span className="landing-hero__accent">
            {HERO.titleAccent}
            <svg viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path d="M2 10 C40 2 70 14 100 8 S160 2 198 9" pathLength={1} />
            </svg>
          </span>
        </h1>
        <p className="landing-lead">{HERO.lead}</p>
        <CtaButtons />
        <p className="mono landing-hero__note">{HERO.note}</p>
      </div>
      <HeroMap />
    </section>
  );
}
