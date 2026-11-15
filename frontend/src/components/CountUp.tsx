import { useEffect, useRef, useState } from "react";

const DURATION_MS = 600;
const easeOut = (x: number) => 1 - (1 - x) ** 3;

/**
 * מציג מספר שעולה/יורד בהדרגה (0.6 שנ') לערך החדש, בפורמט he-IL. תצוגה בלבד: הערך עצמו לא משתנה.
 * המספר המונפש מוסתר מקוראי מסך; לידו יש עותק נסתר של הערך הסופי, כך שאזור aria-live מקריא רק אותו.
 */
export default function CountUp({ value, decimals = 0 }: { value: number | null | undefined; decimals?: number }) {
  // בהופעה הראשונה המספר עולה מ-0
  const [shown, setShown] = useState<number | null>(value == null ? null : 0);
  const from = useRef(0);

  useEffect(() => {
    if (value == null) {
      setShown(null);
      return;
    }
    const start = from.current;
    if (start === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / DURATION_MS);
      const v = start + (value - start) * easeOut(p);
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const fmt = (n: number | null | undefined) =>
    n == null ? "—" : n.toLocaleString("he-IL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <>
      <span aria-hidden="true">{fmt(shown)}</span>
      <span className="visually-hidden">{fmt(value)}</span>
    </>
  );
}
