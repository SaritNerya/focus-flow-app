/** מצב טעינה: שלוש צורות קופצות. */
export default function Loader({ label = "טוען…" }: { label?: string }) {
  return (
    <div className="loader" role="status">
      <span /><span /><span />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
