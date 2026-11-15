import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { currentTheme, saveTheme, type Theme } from "../theme";
import type { User } from "../types";
import Shape from "./Shape";

/** כפתור משתמש בפינת הכותרת: נפתח לתפריט פרופיל / עדכון / מחיקה / התנתקות. */
export default function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const location = useLocation();

  // סגירה במעבר עמוד
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  // סגירה בלחיצה מחוץ לתפריט או ב-Escape (המיקוד חוזר לכפתור)
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const [theme, setTheme] = useState<Theme>(currentTheme);
  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    saveTheme(next);
    setTheme(next);
  };

  const initial = user.display_name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="user-menu" ref={root}>
      <button
        ref={button}
        type="button"
        className="user-btn"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`תפריט משתמש: ${user.display_name}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar" aria-hidden="true">{initial}</span>
        <span className="user-btn__name">{user.display_name}</span>
        <svg className="user-btn__chevron" viewBox="0 0 10 10" aria-hidden="true"><polygon points="0,2 10,2 5,9" fill="currentColor" /></svg>
      </button>

      {open && (
        <div className="user-dropdown" id={menuId}>
          <div className="user-dropdown__head">
            <strong>{user.display_name}</strong>
            <span>{user.email}</span>
          </div>
          <ul>
            <li><Link className="menu-item" to="/profile"><Shape kind="circle" color="var(--lake)" />הצגת הפרופיל</Link></li>
            <li><Link className="menu-item" to="/profile#edit"><Shape kind="square" color="var(--moss)" />עדכון פרטים</Link></li>
            <li><Link className="menu-item" to="/profile#delete"><Shape kind="triangle" color="var(--summit)" />מחיקת חשבון</Link></li>
            <li className="sep">
              <button type="button" className="menu-item" aria-pressed={theme === "dark"} onClick={toggleTheme}>
                <Shape kind="circle" color="var(--ink)" />מצב לילה
              </button>
            </li>
            <li><button type="button" className="menu-item" onClick={onLogout}>התנתקות</button></li>
          </ul>
        </div>
      )}
    </div>
  );
}
