import CtaButtons from "./CtaButtons";
import { HERO } from "./content";

/** איור באוהאוס: עיגול, ריבוע ומשולש בצבעי היסוד. דקורטיבי בלבד. */
function HeroArt() {
  const line = { stroke: "var(--ink)", strokeWidth: 6, strokeLinejoin: "round" as const };
  return (
    <svg className="landing-hero__art" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="400" height="320" fill="var(--blue)" />
      <circle cx="250" cy="140" r="100" fill="var(--yellow)" {...line} />
      <path d="M250 40 A100 100 0 0 1 350 140 L250 140 Z" fill="var(--red)" {...line} />
      <rect x="40" y="60" width="110" height="110" fill="var(--red)" {...line} />
      <rect x="0" y="236" width="400" height="14" fill="var(--ink)" />
      <polygon points="70,236 135,150 200,236" fill="var(--paper)" {...line} />
      <circle cx="340" cy="270" r="26" fill="var(--paper)" {...line} />
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
