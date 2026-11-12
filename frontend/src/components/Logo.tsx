/** לוגו FocusFlow: עיגול, ריבוע ומשולש בצבעי היסוד + שם האתר. */
export default function Logo({ withMark = true }: { withMark?: boolean }) {
  return (
    <>
      {withMark && (
        <svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
          <rect x="1" y="1" width="38" height="38" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
          <rect x="1" y="1" width="19" height="19" fill="var(--blue)" stroke="var(--ink)" strokeWidth="2" />
          <circle cx="29.5" cy="10.5" r="7" fill="var(--red)" stroke="var(--ink)" strokeWidth="2" />
          <polygon points="20,21 39,39 20,39" fill="var(--yellow)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )}
      <span className="logo-word">Focus<b>Flow</b></span>
    </>
  );
}
