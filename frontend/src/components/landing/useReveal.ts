import { useEffect, useRef } from "react";

/**
 * מוסיף לאלמנט את הקלאס is-visible כשהוא נכנס למסך (פעם אחת), כדי להפעיל את אנימציית ההופעה ב-CSS.
 * למי שביקש פחות תנועה ה-CSS לא מסתיר כלום מלכתחילה, כך שהתוכן תמיד גלוי.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("is-visible");
        io.disconnect();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
