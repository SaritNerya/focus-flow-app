import CtaButtons from "./CtaButtons";
import { FINAL_CTA } from "./content";
import { useReveal } from "./useReveal";

export default function FinalCta() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="landing-section landing-final card reveal" aria-labelledby="landing-final">
      <div>
        <h2 id="landing-final">{FINAL_CTA.title}</h2>
        <p>{FINAL_CTA.lead}</p>
      </div>
      <CtaButtons />
    </section>
  );
}
