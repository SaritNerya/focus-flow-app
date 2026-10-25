import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth";

/** מעטפת למסכי משתמש מחובר: ניווט, שם תצוגה והתנתקות. משתמש לא מחובר מועבר להתחברות. */
export default function Layout() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p className="center muted">טוען…</p>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">FocusFlow</Link>
        <nav aria-label="ניווט ראשי">
          <NavLink to="/" end>הספרייה שלי</NavLink>
          <NavLink to="/history">היסטוריית סשנים</NavLink>
        </nav>
        <div className="user">
          <span>שלום, {user.display_name}</span>
          <button className="btn secondary" onClick={logout}>התנתקות</button>
        </div>
      </header>
      <main className="container"><Outlet /></main>
    </>
  );
}
