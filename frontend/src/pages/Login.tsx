import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import FormStatus from "../components/FormStatus";
import GoogleSignIn from "../components/GoogleSignIn";
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
    if (await run(() => login(email, password))) nav("/library", { replace: true });
  }

  return (
    <AuthShell title="התחברות" lead="טוב לראות אתכם שוב. ממשיכים ללמוד?">
      <form onSubmit={submit} noValidate>
        {notice && <p className="success" role="status">{notice}</p>}
        <Field label="אימייל" htmlFor="email" error={fields.email}>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="סיסמה" htmlFor="password" error={fields.password}>
          <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <FormStatus error={error} />
        <button className="btn" type="submit" disabled={busy}>{busy ? "מתחבר…" : "כניסה"}</button>
      </form>
      <GoogleSignIn mode="signin" />
      <p className="auth-switch">אין לכם חשבון? <Link to="/register">הרשמה</Link></p>
    </AuthShell>
  );
}
