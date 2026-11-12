import type { ShapeKind } from "./components/Shape";
import type { ContentType } from "./types";

/** לכל סוג תוכן: שם, צורה וצבע — כדי לזהות אותו במבט בכל האתר. */
export const CONTENT_TYPES: Record<ContentType, { label: string; shape: ShapeKind; color: string; soft: string }> = {
  youtube: { label: "סרטון YouTube", shape: "circle", color: "var(--red)", soft: "var(--red-soft)" },
  text: { label: "טקסט", shape: "square", color: "var(--blue)", soft: "var(--blue-soft)" },
  web: { label: "דף אינטרנט", shape: "triangle", color: "var(--yellow)", soft: "var(--yellow-soft)" },
};

/** סוג תוכן מהשרת עלול להיות חסר (פריט שנמחק) — מחזיר undefined במקרה כזה. */
export const contentTypeInfo = (t?: string | null) => (t && t in CONTENT_TYPES ? CONTENT_TYPES[t as ContentType] : undefined);
