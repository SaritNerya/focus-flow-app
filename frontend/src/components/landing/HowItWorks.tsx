import Shape from "../Shape";
import { HOW_IT_WORKS } from "./content";

/** שלושת הצעדים — באותו עיצוב של צעדי הפתיחה בדף הבית (welcome-steps). */
export default function HowItWorks() {
  return (
    <section className="landing-section" aria-labelledby="landing-how">
      <h2 id="landing-how">{HOW_IT_WORKS.title}</h2>
      <ol className="welcome-steps">
        {HOW_IT_WORKS.steps.map((s, i) => (
          <li key={s.title}>
            <span className="welcome-steps__num" aria-hidden="true">
              <Shape kind={s.shape} color={s.color} outline />{i + 1}
            </span>
            <h3>{s.title}</h3>
            <p className="muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
