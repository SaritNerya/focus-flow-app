import type { ReactNode } from "react";
import Shape, { type ShapeKind } from "./Shape";

export interface LegendRow {
  shape: ShapeKind;
  color: string;
  label: string;
  value: ReactNode;
  sub?: string;
}

/** מקרא בסגנון מפה: סמל בצבע השביל, שם, וערך במונו בצד השני. */
export default function Legend({ rows }: { rows: LegendRow[] }) {
  return (
    <ul className="legend">
      {rows.map((r) => (
        <li key={r.label}>
          <Shape kind={r.shape} color={r.color} />
          <span>{r.label}</span>
          <span className="legend__value">{r.value}</span>
          {r.sub && <span className="legend__sub">{r.sub}</span>}
        </li>
      ))}
    </ul>
  );
}
