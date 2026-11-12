import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { GOOGLE_CLIENT_ID } from "../config";
import { useApiForm } from "../hooks/useApiForm";
import FormStatus from "./FormStatus";

/** הטיפוסים המינימליים של ספריית Google Identity Services שבהם אנחנו משתמשים. */
interface GoogleId {
  initialize(opts: { client_id: string; callback: (r: { credential: string }) => void }): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
}
declare global {
  interface Window { google?: { accounts: { id: GoogleId } } }
}

const SCRIPT_URL = "https://accounts.google.com/gsi/client";
let scriptPromise: Promise<GoogleId> | null = null;

/** טוען את הספרייה של Google פעם אחת בלבד, גם אם הכפתור מוצג בכמה מסכים. */
function loadGoogle(): Promise<GoogleId> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error("google missing")));
    s.onerror = () => {
      scriptPromise = null; // לאפשר ניסיון חוזר
      reject(new Error("load failed"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** הלוגו הרשמי של Google ("G" בארבעה צבעים). */
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * כפתור "התחברות עם Google" — מתאים גם להרשמה וגם להתחברות (משתמש חדש נוצר אוטומטית בשרת).
 *
 * איך הוא בנוי: את הכפתור הרשמי של Google אי אפשר לעצב (הוא iframe). לכן מציגים כפתור בעיצוב
 * שלנו, ומעליו — שקוף לגמרי — את הכפתור האמיתי של Google, שהוא זה שמקבל את הלחיצה.
 * אם אין Client ID בהגדרות, לא מוצג כלום.
 */
export default function GoogleSignIn({ mode }: { mode: "signin" | "signup" }) {
  const { loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const hitArea = useRef<HTMLDivElement>(null);
  const { busy, error, run } = useApiForm();
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  // ה-callback של Google נקבע פעם אחת; ה-ref שומר תמיד את הגרסה העדכנית
  const onCredential = useRef<(credential: string) => void>(() => {});
  onCredential.current = async (credential) => {
    if (await run(() => loginWithGoogle(credential))) nav("/", { replace: true });
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGoogle()
      .then((gid) => {
        const el = hitArea.current;
        if (cancelled || !el) return;
        gid.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => onCredential.current(r.credential) });
        gid.renderButton(el, {
          type: "standard",
          size: "large",
          text: mode === "signup" ? "signup_with" : "signin_with",
          locale: "he",
          width: Math.min(400, Math.max(200, el.clientWidth)), // Google מגבילה רוחב ל-200–400
        });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("failed"));
    return () => { cancelled = true; };
  }, [mode]);

  if (!GOOGLE_CLIENT_ID) return null;

  const label = busy ? "מתחברים…" : mode === "signup" ? "הרשמה עם Google" : "התחברות עם Google";
  const stateClass = busy ? "is-busy" : status === "loading" ? "is-loading" : "";

  return (
    <div className="google-signin">
      <div className="divider"><span>או</span></div>
      {status !== "failed" && (
        <div className={`google-btn ${stateClass}`}>
          <span className="google-btn__face" aria-hidden="true"><GoogleLogo />{label}</span>
          <div ref={hitArea} className="google-btn__hit" />
        </div>
      )}
      <FormStatus error={status === "failed" ? "לא ניתן לטעון את ההתחברות עם Google. בדקו את החיבור לאינטרנט" : error} />
    </div>
  );
}
