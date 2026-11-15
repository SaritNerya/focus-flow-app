const RIDGE = "M2 34 L28 20 L44 26 L70 6 L92 22 L108 16 L138 34";

/** מצב טעינה: קו רכס שמתמלא (סטטי למי שביקש פחות תנועה). */
export default function Loader({ label = "טוען…" }: { label?: string }) {
  return (
    <div className="loader" role="status">
      <svg viewBox="0 0 140 40" aria-hidden="true" focusable="false">
        <path className="loader__track" d={RIDGE} />
        <path className="loader__fill" d={RIDGE} pathLength={1} />
      </svg>
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
