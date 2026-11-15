import type { CSSProperties } from "react";
import Shape from "../Shape";
import { HOW_IT_WORKS } from "./content";
import { useReveal } from "./useReveal";

/** שלושת הצעדים כנקודות ציון על שביל אחד. השביל נמתח והנקודות מופיעות כשהקטע נכנס למסך. */
export default function HowItWorks() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="landing-section reveal" aria-labelledby="landing-how">
      <div className="landing-section__head">
        <span className="mono">{HOW_IT_WORKS.eyebrow}</span>
        <h2 id="landing-how">{HOW_IT_WORKS.title}</h2>
      </div>
      <ol className="landing-steps">
        {HOW_IT_WORKS.steps.map((s, i) => (
          <li key={s.title} style={{ "--i": i } as CSSProperties}>
            <span className="landing-steps__marker" aria-hidden="true"><Shape kind={s.shape} color={s.color} /></span>
            <span className="mono landing-steps__num" aria-hidden="true">{`0${i + 1}`}</span>
            <h3>{s.title}</h3>
            <p className="muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
