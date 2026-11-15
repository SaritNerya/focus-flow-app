/** לוגו FocusFlow: סמל פסגה (▲ עם שני קווי גובה) + שם האתר. */
export default function Logo({ withMark = true }: { withMark?: boolean }) {
  return (
    <>
      {withMark && (
        <svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
          <path d="M3 33 C10 25 15 22 20 22 S31 26 37 33" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 38 C13 32 17 30 20 30 S28 33 33 38" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" opacity=".55" />
          <polygon points="20,3 30,19 10,19" fill="var(--summit)" />
        </svg>
      )}
      <span className="logo-word">FocusFlow</span>
    </>
  );
}
