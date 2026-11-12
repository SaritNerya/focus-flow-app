import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import Field from "../components/Field";
import FormStatus from "../components/FormStatus";
import PasswordInput from "../components/PasswordInput";
import { useApiForm } from "../hooks/useApiForm";
import type { User } from "../types";
import { CONFIRM_HINT, PASSWORD_HINT, requireField, validateNewPassword } from "../validation";

/** עמוד פרופיל: פרטים נוכחיים, עדכון שם תצוגה, החלפת סיסמה ומחיקת חשבון. */
export default function Profile() {
  const { user } = useAuth();
  if (!user) return null; // Layout כבר מעביר משתמש לא מחובר להתחברות

  return (
    <div className="profile">
      <h1>הפרופיל שלי</h1>
      <ProfileDetails user={user} />
      <DisplayNameForm current={user.display_name} />
      {user.has_password ? <PasswordForm /> : <GoogleAccountNote />}
      <DeleteAccount user={user} />
    </div>
  );
}

function ProfileDetails({ user }: { user: User }) {
  return (
    <section className="card" aria-labelledby="details-title">
      <h2 id="details-title">הפרטים שלי</h2>
      <dl className="details">
        <dt>שם תצוגה</dt>
        <dd>{user.display_name}</dd>
        <dt>אימייל</dt>
        <dd dir="ltr">{user.email}</dd>
        <dt>תאריך הצטרפות</dt>
        <dd>{new Date(user.created_at).toLocaleDateString("he-IL", { dateStyle: "long" })}</dd>
      </dl>
    </section>
  );
}

function DisplayNameForm({ current }: { current: string }) {
  const { updateDisplayName } = useAuth();
  const [name, setName] = useState(current);
  const { busy, error, fields, success, run } = useApiForm();
  const unchanged = name.trim() === current;

  async function submit(e: FormEvent) {
    e.preventDefault();
    await run(() => updateDisplayName(name), {
      validate: () => requireField(name, "display_name", "יש להזין שם תצוגה"),
      success: "שם התצוגה עודכן",
    });
  }

  return (
    <section className="card" aria-labelledby="name-title">
      <h2 id="name-title">עדכון שם תצוגה</h2>
      <form onSubmit={submit} noValidate>
        <Field label="שם תצוגה חדש" htmlFor="display_name" error={fields.display_name} hint="עד 50 תווים">
          <input id="display_name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" maxLength={50} required />
        </Field>
        <FormStatus error={error} success={success} />
        <button className="btn" type="submit" disabled={busy || unchanged}>{busy ? "שומר…" : "שמירת השם"}</button>
      </form>
    </section>
  );
}

function GoogleAccountNote() {
  return (
    <section className="card" aria-labelledby="password-title">
      <h2 id="password-title">סיסמה</h2>
      <p className="muted">החשבון שלכם מחובר דרך Google ואין לו סיסמה באתר. ההתחברות נעשית בכפתור "התחברות עם Google".</p>
    </section>
  );
}

function PasswordForm() {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const { busy, error, fields, success, run } = useApiForm();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const ok = await run(() => changePassword(current, next), {
      validate: () => ({
        ...requireField(current, "current_password", "יש להזין את הסיסמה הנוכחית"),
        ...validateNewPassword(next, confirm, "new_password"),
      }),
      success: "הסיסמה הוחלפה. החיבורים בשאר המכשירים נותקו.",
    });
    if (ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  }

  return (
    <section className="card" aria-labelledby="password-title">
      <h2 id="password-title">החלפת סיסמה</h2>
      <form onSubmit={submit} noValidate>
        <Field label="סיסמה נוכחית" htmlFor="current_password" error={fields.current_password}>
          <PasswordInput id="current_password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </Field>
        <Field label="סיסמה חדשה" htmlFor="new_password" error={fields.new_password} hint={PASSWORD_HINT}>
          <PasswordInput id="new_password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
        </Field>
        <Field label="אימות סיסמה חדשה" htmlFor="confirm_new_password" error={fields.confirm} hint={CONFIRM_HINT}>
          <PasswordInput id="confirm_new_password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required noPaste />
        </Field>
        <FormStatus error={error} success={success} />
        <button className="btn" type="submit" disabled={busy}>{busy ? "מחליף…" : "החלפת סיסמה"}</button>
      </form>
    </section>
  );
}

function DeleteAccount({ user }: { user: User }) {
  const { deleteAccount } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  // אישור בסיסמה; משתמש Google בלי סיסמה מאשר בהקלדת האימייל של החשבון
  const byPassword = user.has_password;
  const field = byPassword ? "password" : "email";
  const [value, setValue] = useState("");
  const [understood, setUnderstood] = useState(false);
  const { busy, error, fields, run } = useApiForm();

  function cancel() {
    setOpen(false);
    setValue("");
    setUnderstood(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    await run(
      async () => {
        await deleteAccount(byPassword ? { password: value } : { email: value });
        nav("/login", { replace: true, state: { notice: "החשבון וכל הנתונים שלו נמחקו לצמיתות." } });
      },
      {
        validate: () => byPassword
          ? requireField(value, field, "יש להזין סיסמה כדי לאשר")
          : value.trim().toLowerCase() === user.email ? {} : { [field]: "האימייל אינו תואם לחשבון" },
      },
    );
  }

  return (
    <section className="card danger-zone" aria-labelledby="delete-title">
      <h2 id="delete-title">מחיקת חשבון</h2>
      <p>מחיקת החשבון היא <strong>סופית ואי אפשר לבטל אותה</strong>. יימחקו:</p>
      <ul>
        <li>פרטי החשבון שלכם</li>
        <li>כל התכנים בספרייה שלכם</li>
        <li>כל היסטוריית הסשנים וציוני הקשב</li>
      </ul>

      {!open ? (
        <button className="btn danger" type="button" onClick={() => setOpen(true)}>מחיקת החשבון…</button>
      ) : (
        <form onSubmit={submit} noValidate className="confirm-delete">
          {byPassword ? (
            <Field label="הקלידו את הסיסמה שלכם לאישור" htmlFor="delete_confirm" error={fields[field]}>
              <PasswordInput id="delete_confirm" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="current-password" required autoFocus />
            </Field>
          ) : (
            <Field label={`הקלידו את האימייל של החשבון לאישור (${user.email})`} htmlFor="delete_confirm" error={fields[field]}>
              <input id="delete_confirm" type="email" dir="ltr" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" required autoFocus />
            </Field>
          )}
          <label className="checkbox">
            <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
            אני מבין/ה שהחשבון וכל הנתונים יימחקו לצמיתות
          </label>
          <FormStatus error={error} />
          <div className="actions">
            <button className="btn danger" type="submit" disabled={busy || !understood}>{busy ? "מוחק…" : "כן, למחוק את החשבון לצמיתות"}</button>
            <button className="btn secondary" type="button" onClick={cancel} disabled={busy}>ביטול</button>
          </div>
        </form>
      )}
    </section>
  );
}
