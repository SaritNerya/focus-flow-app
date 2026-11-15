import CtaButtons from "./CtaButtons";
import { HERO } from "./content";

const RINGS = [150, 122, 96, 72, 50, 30];

/** איור: מפת גובה קטנה עם שביל מקווקו שמטפס לפסגה. דקורטיבי בלבד. */
function HeroArt() {
  return (
    <svg className="landing-hero__art" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <rect width="400" height="320" fill="var(--surface)" />
      {RINGS.map((r, i) => (
        <ellipse
          key={r}
          cx={210 + i * 4}
          cy={150 - i * 3}
          rx={r * 1.25}
          ry={r * 0.85}
          fill="none"
          stroke="var(--contour)"
          strokeWidth={i % 3 === 2 ? 1.6 : 1}
          strokeOpacity={i % 3 === 2 ? 0.6 : 0.3}
        />
      ))}
      <path className="landing-hero__trail" d="M40 300 C90 270 120 240 150 220 S200 190 196 168 S214 140 230 135" />
      <polygon points="230,112 244,136 216,136" fill="var(--summit)" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero__text">
        <h1 id="landing-title">{HERO.title}</h1>
        <p className="landing-lead">{HERO.lead}</p>
        <CtaButtons />
      </div>
      <HeroArt />
    </section>
  );
}
