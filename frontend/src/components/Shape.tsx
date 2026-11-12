export type ShapeKind = "circle" | "square" | "triangle";

/** צורה גאומטרית בסגנון באוהאוס. דקורטיבית בלבד (מוסתרת מקוראי מסך). */
export default function Shape({ kind, color, outline = false, className }: {
  kind: ShapeKind;
  color: string;          // למשל "var(--red)"
  outline?: boolean;      // קו מתאר שחור סביב הצורה
  className?: string;
}) {
  const stroke = outline ? { stroke: "var(--ink)", strokeWidth: 1.5 } : {};
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" className={className} aria-hidden="true" focusable="false">
      {kind === "circle" && <circle cx="10" cy="10" r="9" fill={color} {...stroke} />}
      {kind === "square" && <rect x="1.5" y="1.5" width="17" height="17" fill={color} {...stroke} />}
      {kind === "triangle" && <polygon points="10,1.5 19,18.5 1,18.5" fill={color} {...stroke} strokeLinejoin="round" />}
    </svg>
  );
}
