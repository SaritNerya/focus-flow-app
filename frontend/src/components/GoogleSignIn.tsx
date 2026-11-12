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

/**
 * כפתור "התחברות עם Google" — מתאים גם להרשמה וגם להתחברות
 * (משתמש חדש נוצר אוטומטית בשרת). אם אין Client ID בהגדרות, לא מוצג כלום.
 */
export default function GoogleSignIn({ mode }: { mode: "signin" | "signup" }) {
  const { loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const box = useRef<HTMLDivElement>(null);
  const { error, run } = useApiForm();
  // ה-callback של Google נקבע פעם אחת; ה-ref שומר תמיד את הגרסה העדכנית
  const onCredential = useRef<(credential: string) => void>(() => {});
  onCredential.current = async (credential) => {
    if (await run(() => loginWithGoogle(credential))) nav("/", { replace: true });
  };
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGoogle()
      .then((gid) => {
        if (cancelled || !box.current) return;
        gid.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => onCredential.current(r.credential) });
        gid.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: mode === "signup" ? "signup_with" : "signin_with",
          locale: "he",
          width: box.current.clientWidth || 320,
        });
      })
      .catch(() => !cancelled && setLoadFailed(true));
    return () => { cancelled = true; };
  }, [mode]);

  if (!GOOGLE_CLIENT_ID) return null;
  return (
    <div className="google-signin">
      <div className="divider" role="separator"><span>או</span></div>
      <div ref={box} className="google-btn" />
      <FormStatus error={loadFailed ? "לא ניתן לטעון את ההתחברות עם Google. בדקו את החיבור לאינטרנט" : error} />
    </div>
  );
}
