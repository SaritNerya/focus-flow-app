import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import Field from "../components/Field";
import FormStatus from "../components/FormStatus";
import PasswordInput from "../components/PasswordInput";
import { useApiForm } from "../hooks/useApiForm";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  // הודעה ממסך קודם (למשל אחרי הרשמה או מחיקת חשבון)
  const notice = (useLocation().state as { notice?: string } | null)?.notice;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { busy, error, fields, run } = useApiForm();

  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (await run(() => login(email, password))) nav("/", { replace: true });
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>התחברות ל-FocusFlow</h1>
        <p className="muted">אתר לימוד שמודד קשב דרך המצלמה ועוזר לכם להישאר ממוקדים.</p>
        {notice && <p className="success" role="status">{notice}</p>}
        <Field label="אימייל" htmlFor="email" error={fields.email}>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="סיסמה" htmlFor="password" error={fields.password}>
          <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <FormStatus error={error} />
        <button className="btn" type="submit" disabled={busy}>{busy ? "מתחבר…" : "כניסה"}</button>
        <p>אין לכם חשבון? <Link to="/register">הרשמה</Link></p>
      </form>
    </div>
  );
}
