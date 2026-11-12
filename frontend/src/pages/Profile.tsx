import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import Field from "../components/Field";
import FormStatus from "../components/FormStatus";
import PasswordInput from "../components/PasswordInput";
import Shape, { type ShapeKind } from "../components/Shape";
import { useApiForm } from "../hooks/useApiForm";
import type { User } from "../types";
import { CONFIRM_HINT, PASSWORD_HINT, requireField, validateNewPassword } from "../validation";

/**
 * עמוד פרופיל: פרטים נוכחיים, עדכון שם תצוגה, החלפת סיסמה ומחיקת חשבון.
 * קישור עם עוגן (‎/profile#edit, ‎/profile#delete — מתפריט המשתמש) גולל לחלק המתאים ומדגיש אותו.
 */
export default function Profile() {
  const { user } = useAuth();
  const location = useLocation();

  // location.key משתנה בכל ניווט — כך גם בחירה חוזרת באותו פריט בתפריט גוללת שוב
  useEffect(() => {
    const el = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("is-target");
    el.querySelector<HTMLElement>("input")?.focus({ preventScroll: true });
    const t = setTimeout(() => el.classList.remove("is-target"), 1500);
    return () => {
      clearTimeout(t);
      el.classList.remove("is-target");
    };
  }, [location.key, location.hash]);

  if (!user) return null; // Layout כבר מעביר משתמש לא מחובר להתחברות

  return (
    <>
      <header className="profile-head">
        <span className="avatar lg" aria-hidden="true">{user.display_name.trim().charAt(0).toUpperCase() || "?"}</span>
        <div>
          <h1>{user.display_name}</h1>
          <p><bdi>{user.email}</bdi></p>
        </div>
      </header>
      <div className="profile-grid">
        <ProfileDetails user={user} />
        <DisplayNameForm current={user.display_name} />
        {user.has_password ? <PasswordForm /> : <GoogleAccountNote />}
        <DeleteAccount user={user} startOpen={location.hash === "#delete"} />
      </div>
    </>
  );
}

/** כותרת כרטיס עם צורה צבעונית. */
function CardTitle({ id, shape, color, children }: { id: string; shape: ShapeKind; color: string; children: string }) {
  return <h2 id={id} className="card-title"><Shape kind={shape} color={color} outline />{children}</h2>;
}

function ProfileDetails({ user }: { user: User }) {
  return (
    <section id="details" className="card" aria-labelledby="details-title">
      <CardTitle id="details-title" shape="circle" color="var(--yellow)">הפרטים שלי</CardTitle>
      <dl className="details">
        <dt>שם תצוגה</dt>
        <dd>{user.display_name}</dd>
        <dt>אימייל</dt>
        <dd><bdi>{user.email}</bdi></dd>
        <dt>סוג התחברות</dt>
        <dd>{user.has_password ? "אימייל וסיסמה" : "חשבון Google"}</dd>
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
    <section id="edit" className="card" aria-labelledby="name-title">
      <CardTitle id="name-title" shape="square" color="var(--blue)">עדכון שם תצוגה</CardTitle>
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
    <section id="password" className="card" aria-labelledby="password-title">
      <CardTitle id="password-title" shape="triangle" color="var(--yellow)">סיסמה</CardTitle>
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
    <section id="password" className="card" aria-labelledby="password-title">
      <CardTitle id="password-title" shape="triangle" color="var(--yellow)">החלפת סיסמה</CardTitle>
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

function DeleteAccount({ user, startOpen }: { user: User; startOpen: boolean }) {
  const { deleteAccount } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(startOpen);
  // בחירה ב"מחיקת חשבון" מהתפריט כשכבר נמצאים בעמוד — פותחת את טופס האישור
  useEffect(() => {
    if (startOpen) setOpen(true);
  }, [startOpen]);
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
    <section id="delete" className="card danger-zone pop-red wide" aria-labelledby="delete-title">
      <CardTitle id="delete-title" shape="circle" color="var(--red)">מחיקת חשבון</CardTitle>
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
