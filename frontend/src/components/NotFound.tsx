import { Link } from "react-router-dom";
import Shape from "./Shape";

export default function NotFound({ what = "העמוד" }: { what?: string }) {
  return (
    <div className="not-found">
      <div className="not-found__art" aria-hidden="true">
        4<Shape kind="circle" color="var(--red)" outline />4
      </div>
      <h1>{what} לא נמצא</h1>
      <p className="muted">ייתכן שהקישור שגוי או שהפריט נמחק.</p>
      <Link className="btn" to="/">חזרה לספרייה</Link>
    </div>
  );
}
