import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth";
import Loader from "./Loader";
import Logo from "./Logo";
import UserMenu from "./UserMenu";

const NAV: { to: string; label: string; end?: boolean }[] = [
  { to: "/", label: "בית", end: true },
  { to: "/library", label: "הספרייה שלי" },
  { to: "/history", label: "היסטוריה" },
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
          <Link to="/" className="brand" aria-label="FocusFlow — לדף הבית"><Logo /></Link>
          <nav className="main-nav" aria-label="ניווט ראשי">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>{n.label}</NavLink>
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
