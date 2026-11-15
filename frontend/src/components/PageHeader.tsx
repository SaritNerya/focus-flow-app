import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/** כותרת אחידה לכל עמוד: קישור חזרה, כיתוב מונו קטן, כותרת, תת-כותרת ופעולות. */
export default function PageHeader({ title, subtitle, caption, compact = false, back, children }: {
  title: ReactNode;
  subtitle?: ReactNode;
  caption?: ReactNode;    // כיתוב קרטוגרפי קטן מעל הכותרת (מונו)
  compact?: boolean;      // כותרת קטנה יותר — לכותרות שהמשתמש כתב (שם פריט)
  back?: { to: string; label: string };
  children?: ReactNode;   // כפתורי פעולה בצד הכותרת
}) {
  return (
    <header className={`page-header ${compact ? "compact" : ""}`}>
      <div>
        {back && <Link to={back.to} className="back-link"><span aria-hidden="true">→</span> {back.label}</Link>}
        {caption && <span className="page-header__caption mono">{caption}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </header>
  );
}
