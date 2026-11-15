import { PRIVACY } from "./content";
import { useReveal } from "./useReveal";

export default function PrivacyNote() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="landing-section card reveal" aria-labelledby="landing-privacy">
      <h2 id="landing-privacy">{PRIVACY.title}</h2>
      <ul className="landing-privacy">
        {PRIVACY.points.map((p) => <li key={p}>{p}</li>)}
      </ul>
    </section>
  );
}
