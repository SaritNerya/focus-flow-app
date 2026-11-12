import type { ReactNode } from "react";

/** כרטיס "אין כאן עדיין כלום": שלוש הצורות, כותרת והסבר מה עושים עכשיו. */
export default function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card empty">
      <svg viewBox="0 0 120 40" aria-hidden="true" focusable="false">
        <circle cx="20" cy="20" r="16" fill="var(--red)" stroke="var(--ink)" strokeWidth="2" />
        <rect x="44" y="4" width="32" height="32" fill="var(--blue)" stroke="var(--ink)" strokeWidth="2" />
        <polygon points="100,4 118,36 82,36" fill="var(--yellow)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <h3>{title}</h3>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
