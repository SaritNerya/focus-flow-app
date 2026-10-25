import type { ReactNode } from "react";

/** שדה בטופס: תווית גלויה, רמז והודעת שגיאה צמודה לשדה. */
export default function Field({ label, error, hint, children, htmlFor }: {
  label: string; error?: string; hint?: string; children: ReactNode; htmlFor: string;
}) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <small className="muted">{hint}</small>}
      {error && <small className="error" role="alert">{error}</small>}
    </div>
  );
}
