import { HONEST_NOTE } from "./content";
import { useReveal } from "./useReveal";

/** הערה כנה על גבולות ציון הקשב. */
export default function HonestNote() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="landing-section notice warn reveal" aria-labelledby="landing-honest">
      <h2 id="landing-honest">{HONEST_NOTE.title}</h2>
      <p>{HONEST_NOTE.text}</p>
    </section>
  );
}
