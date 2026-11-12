import type { CSSProperties } from "react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth";
import Loader from "./Loader";
import Logo from "./Logo";
import Shape, { type ShapeKind } from "./Shape";
import UserMenu from "./UserMenu";

const NAV: { to: string; label: string; shape: ShapeKind; color: string; end?: boolean }[] = [
  { to: "/", label: "הספרייה שלי", shape: "circle", color: "var(--red)", end: true },
  { to: "/history", label: "היסטוריה", shape: "square", color: "var(--blue)" },
];

/** מעטפת למסכי משתמש מחובר: לוגו, ניווט (בנייד — סרגל תחתון) ותפריט משתמש. משתמש לא מחובר מועבר להתחברות. */
export default function Layout() {
  const { user, loading, logout } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <a href="#main" className="skip-link">דילוג לתוכן</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="FocusFlow — לספרייה"><Logo /></Link>
          <nav className="main-nav" aria-label="ניווט ראשי">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} style={{ "--nav-color": n.color } as CSSProperties}>
                <Shape kind={n.shape} color={n.color} outline />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <UserMenu user={user} onLogout={logout} />
        </div>
      </header>
      <main id="main" className="container page" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
