import type { CSSProperties } from "react";
import Shape from "../Shape";
import { FEATURES } from "./content";
import { useReveal } from "./useReveal";

export default function Features() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="landing-section reveal" aria-labelledby="landing-features">
      <div className="landing-section__head">
        <span className="mono">{FEATURES.eyebrow}</span>
        <h2 id="landing-features">{FEATURES.title}</h2>
      </div>
      <ul className="landing-features">
        {FEATURES.items.map((f, i) => (
          <li key={f.title} className="card lift" style={{ "--i": i, "--feature-color": f.color } as CSSProperties}>
            <span className="landing-features__icon" aria-hidden="true"><Shape kind={f.shape} color={f.color} /></span>
            <h3>{f.title}</h3>
            <p className="muted">{f.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
