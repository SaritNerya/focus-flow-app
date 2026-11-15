import CtaButtons from "./CtaButtons";
import { FINAL_CTA } from "./content";

export default function FinalCta() {
  return (
    <section className="landing-section landing-final card" aria-labelledby="landing-final">
      <h2 id="landing-final">{FINAL_CTA.title}</h2>
      <p>{FINAL_CTA.lead}</p>
      <CtaButtons />
    </section>
  );
}
