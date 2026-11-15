import { HONEST_NOTE } from "./content";

/** הערה כנה על גבולות ציון הקשב. */
export default function HonestNote() {
  return (
    <section className="landing-section notice warn" aria-labelledby="landing-honest">
      <h2 id="landing-honest">{HONEST_NOTE.title}</h2>
      <p>{HONEST_NOTE.text}</p>
    </section>
  );
}
