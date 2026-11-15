import type { ReactNode } from "react";

/** כרטיס "אין כאן עדיין כלום": פסגה קטנה עם קווי גובה, כותרת והסבר מה עושים עכשיו. */
export default function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card empty">
      <svg viewBox="0 0 120 56" aria-hidden="true" focusable="false">
        <ellipse cx="60" cy="38" rx="56" ry="16" fill="none" stroke="var(--line-strong)" strokeWidth="1" />
        <ellipse cx="60" cy="36" rx="36" ry="10" fill="none" stroke="var(--line-strong)" strokeWidth="1" />
        <polygon points="60,6 74,32 46,32" fill="var(--summit)" />
      </svg>
      <h3>{title}</h3>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
