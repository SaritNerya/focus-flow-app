import { Link } from "react-router-dom";

export default function NotFound({ what = "העמוד" }: { what?: string }) {
  return (
    <div className="card center">
      <h1>{what} לא נמצא</h1>
      <p className="muted">ייתכן שהקישור שגוי או שהפריט נמחק.</p>
      <Link className="btn" to="/">חזרה לספרייה</Link>
    </div>
  );
}
