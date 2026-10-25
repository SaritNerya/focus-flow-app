import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api";
import { useAuth } from "../auth";
import Field from "../components/Field";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const notice = (useLocation().state as { registered?: boolean } | null)?.registered;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      nav("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "אירעה שגיאה. נסו שוב");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>התחברות ל-FocusFlow</h1>
        <p className="muted">אתר לימוד שמודד קשב דרך המצלמה ועוזר לכם להישאר ממוקדים.</p>
        {notice && <p className="success" role="status">ההרשמה הצליחה! אפשר להתחבר.</p>}
        <Field label="אימייל" htmlFor="email">
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="סיסמה" htmlFor="password">
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" type="submit" disabled={busy}>{busy ? "מתחבר…" : "כניסה"}</button>
        <p>אין לכם חשבון? <Link to="/register">הרשמה</Link></p>
      </form>
    </div>
  );
}
