export type ShapeKind = "circle" | "square" | "triangle";

/**
 * סמל מפה קטן: ● (circle), — קטע שביל (square), ▲ פסגה (triangle). דקורטיבי בלבד (מוסתר מקוראי מסך).
 * השמות נשמרו מהעיצוב הקודם כדי שכל הקוראים ימשיכו לעבוד.
 */
export default function Shape({ kind, color, className = "" }: {
  kind: ShapeKind;
  color: string;          // למשל "var(--lake)"
  className?: string;
}) {
  return (
    <svg viewBox="0 0 20 20" className={`map-symbol ${className}`.trim()} aria-hidden="true" focusable="false">
      {kind === "circle" && <circle cx="10" cy="10" r="6.5" fill={color} />}
      {kind === "square" && <rect x="1" y="7.5" width="18" height="5" rx="1" fill={color} />}
      {kind === "triangle" && <polygon points="10,3 18.5,17 1.5,17" fill={color} />}
    </svg>
  );
}
