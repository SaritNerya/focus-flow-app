import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Shape, { type ShapeKind } from "./Shape";

/** כותרת אחידה לכל עמוד: קישור חזרה (אופציונלי), צורה צבעונית, כותרת, תת-כותרת ופעולות. */
export default function PageHeader({ title, subtitle, shape = "square", color = "var(--blue)", back, children }: {
  title: ReactNode;
  subtitle?: ReactNode;
  shape?: ShapeKind;
  color?: string;
  back?: { to: string; label: string };
  children?: ReactNode; // כפתורי פעולה בצד הכותרת
}) {
  return (
    <header className="page-header">
      <div>
        {back && <Link to={back.to} className="back-link"><span aria-hidden="true">→</span> {back.label}</Link>}
        <h1><Shape kind={shape} color={color} outline />{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </header>
  );
}
