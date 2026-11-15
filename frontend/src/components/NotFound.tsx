import { Link } from "react-router-dom";

export default function NotFound({ what = "העמוד" }: { what?: string }) {
  return (
    <div className="card not-found">
      <div className="giant not-found__code" aria-hidden="true">404</div>
      <h1>{what} לא נמצא</h1>
      <p className="muted">ייתכן שהקישור שגוי או שהפריט נמחק.</p>
      <Link className="btn" to="/library">חזרה לספרייה</Link>
    </div>
  );
}
