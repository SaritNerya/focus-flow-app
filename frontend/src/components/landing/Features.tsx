import Shape from "../Shape";
import { FEATURES } from "./content";

export default function Features() {
  return (
    <section className="landing-section" aria-labelledby="landing-features">
      <h2 id="landing-features">{FEATURES.title}</h2>
      <ul className="landing-features">
        {FEATURES.items.map((f) => (
          <li key={f.title} className="card lift">
            <h3 className="card-title"><Shape kind={f.shape} color={f.color} />{f.title}</h3>
            <p className="muted">{f.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
