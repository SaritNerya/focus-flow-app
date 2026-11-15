import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import FormStatus from "../components/FormStatus";
import GoogleSignIn from "../components/GoogleSignIn";
import PasswordInput from "../components/PasswordInput";
import { useApiForm } from "../hooks/useApiForm";
import { CONFIRM_HINT, PASSWORD_HINT, validateNewPassword } from "../validation";

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { busy, error, fields, run } = useApiForm();

  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const ok = await run(() => register(email, password, displayName), {
      validate: () => validateNewPassword(password, confirm),
    });
    // אחרי הרשמה לא מתחברים אוטומטית: עוברים למסך ההתחברות עם הודעה
    if (ok) nav("/login", { replace: true, state: { notice: "ההרשמה הצליחה, אפשר להתחבר" } });
  }

  return (
    <AuthShell title="הרשמה" lead="פותחים חשבון בחינם ומתחילים ללמוד בריכוז.">
      <form onSubmit={submit} noValidate>
        <Field label="שם תצוגה" htmlFor="display_name" error={fields.display_name}>
          <input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="nickname" required />
        </Field>
        <Field label="אימייל" htmlFor="email" error={fields.email}>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </Field>
        <Field label="סיסמה" htmlFor="password" error={fields.password} hint={PASSWORD_HINT}>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        </Field>
        <Field label="אימות סיסמה" htmlFor="confirm_password" error={fields.confirm} hint={CONFIRM_HINT}>
          <PasswordInput id="confirm_password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required noPaste />
        </Field>
        <FormStatus error={error} />
        <button className="btn" type="submit" disabled={busy}>{busy ? "נרשם…" : "הרשמה"}</button>
      </form>
      <GoogleSignIn mode="signup" />
      <p className="auth-switch">כבר יש לכם חשבון? <Link to="/login">התחברות</Link></p>
    </AuthShell>
  );
}
