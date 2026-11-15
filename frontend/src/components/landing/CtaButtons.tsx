import { Link } from "react-router-dom";
import { CTA_LINKS } from "./content";

/** כפתורי "הרשמה" ו"התחברות" — משותפים לראש הדף ולסופו. */
export default function CtaButtons() {
  return (
    <div className="actions landing-cta">
      {CTA_LINKS.map((l) => (
        <Link key={l.to} to={l.to} className={l.className}>{l.label}</Link>
      ))}
    </div>
  );
}
