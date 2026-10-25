import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../api";
import { useAuth } from "../auth";
import Field from "../components/Field";

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFields({});
    setBusy(true);
    try {
      await register(email, password, displayName);
      nav("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields);
        if (Object.keys(err.fields).length === 0) setError(err.message);
      } else setError("אירעה שגיאה. נסו שוב");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>הרשמה ל-FocusFlow</h1>
        <Field label="שם תצוגה" htmlFor="display_name" error={fields.display_name}>
          <input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="nickname" required />
        </Field>
        <Field label="אימייל" htmlFor="email" error={fields.email}>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </Field>
        <Field label="סיסמה" htmlFor="password" error={fields.password} hint="לפחות 8 תווים">
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        </Field>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" type="submit" disabled={busy}>{busy ? "נרשם…" : "הרשמה"}</button>
        <p>כבר יש לכם חשבון? <Link to="/login">התחברות</Link></p>
      </form>
    </div>
  );
}
