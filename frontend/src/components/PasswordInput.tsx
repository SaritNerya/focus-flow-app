import { useState, type InputHTMLAttributes, type SyntheticEvent } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** חוסם הדבקה וגרירה — לשדות אימות סיסמה, כדי שהמשתמש יקליד בעצמו. */
  noPaste?: boolean;
};

const block = (e: SyntheticEvent) => e.preventDefault();

/** שדה סיסמה עם כפתור עין בתוך התיבה להצגה/הסתרה של הסיסמה. */
export default function PasswordInput({ noPaste, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-wrap">
      <input
        {...props}
        type={visible ? "text" : "password"}
        onPaste={noPaste ? block : props.onPaste}
        onDrop={noPaste ? block : props.onDrop}
      />
      <button
        type="button"
        className="eye-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
        aria-pressed={visible}
        title={visible ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <line x1="3" y1="3" x2="21" y2="21" />}
        </svg>
      </button>
    </div>
  );
}
