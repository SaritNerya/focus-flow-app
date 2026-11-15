import { PRIVACY } from "./content";

export default function PrivacyNote() {
  return (
    <section className="landing-section card pop-blue" aria-labelledby="landing-privacy">
      <h2 id="landing-privacy">{PRIVACY.title}</h2>
      <ul className="landing-privacy">
        {PRIVACY.points.map((p) => <li key={p}>{p}</li>)}
      </ul>
    </section>
  );
}
