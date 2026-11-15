import type { ShapeKind } from "./components/Shape";
import type { ContentType } from "./types";

/** לכל סוג תוכן: שם, סמל מפה וצבע שביל — כדי לזהות אותו במבט בכל האתר. */
export const CONTENT_TYPES: Record<ContentType, { label: string; shape: ShapeKind; color: string }> = {
  youtube: { label: "סרטון YouTube", shape: "circle", color: "var(--lake)" },
  text: { label: "טקסט", shape: "square", color: "var(--moss)" },
  web: { label: "דף אינטרנט", shape: "triangle", color: "var(--ochre)" },
};

/** סוג תוכן מהשרת עלול להיות חסר (פריט שנמחק) — מחזיר undefined במקרה כזה. */
export const contentTypeInfo = (t?: string | null) => (t && t in CONTENT_TYPES ? CONTENT_TYPES[t as ContentType] : undefined);
