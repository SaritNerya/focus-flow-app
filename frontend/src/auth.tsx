import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, getToken, setToken } from "./api";
import type { TokenOut, User } from "./types";

interface AuthValue {
  user: User | null;
  loading: boolean;
  /** בדיקת הטוקן בטעינה נכשלה בגלל רשת/שרת (לא 401): הטוקן נשמר ומוצגת הודעת "אין חיבור לשרת". */
  offline: boolean;
  /** ניסיון חוזר לבדוק את הטוקן מול השרת. */
  retrySession: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (email: string, password: string, display_name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateDisplayName: (display_name: string) => Promise<void>;
  changePassword: (current_password: string, new_password: string) => Promise<void>;
  /** אישור: הסיסמה, או האימייל למשתמש בלי סיסמה (Google). */
  deleteAccount: (confirmation: { password: string } | { email: string }) => Promise<void>;
}

const Ctx = createContext<AuthValue>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getToken()); // רענון הדף לא מתנתק
  const [offline, setOffline] = useState(false);

  const refreshUser = useCallback(async () => setUser(await api<User>("/api/users/me")), []);

  // בדיקת הטוקן השמור. רק 401 מנתק (api() כבר מוחק את הטוקן ומודיע). שגיאת רשת או 500 — הטוקן נשמר
  const checkSession = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    setOffline(false);
    try {
      await refreshUser();
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  const startSession = async (t: TokenOut) => {
    setToken(t.access_token);
    await refreshUser();
  };
  const login = async (email: string, password: string) =>
    startSession(await api<TokenOut>("/api/auth/login", { method: "POST", body: { email, password }, auth: false }));
  const loginWithGoogle = async (credential: string) =>
    startSession(await api<TokenOut>("/api/auth/google", { method: "POST", body: { credential }, auth: false }));
  const register = async (email: string, password: string, display_name: string) => {
    await api("/api/auth/register", { method: "POST", body: { email, password, display_name }, auth: false });
  };
  const clearSession = () => {
    setToken(null);
    setUser(null);
  };
  const logout = async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } catch { /* מתנתקים מקומית בכל מקרה */ }
    clearSession();
  };

  const updateDisplayName = async (display_name: string) => {
    setUser(await api<User>("/api/users/me", { method: "PATCH", body: { display_name } }));
  };
  // השרת פוסל את כל הטוקנים (גם את הנוכחי), ולכן אחרי ההחלפה מתנתקים ומתחברים מחדש
  const changePassword = async (current_password: string, new_password: string) => {
    await api("/api/users/me/password", { method: "POST", body: { current_password, new_password } });
    clearSession();
  };
  const deleteAccount: AuthValue["deleteAccount"] = async (confirmation) => {
    await api("/api/users/me", { method: "DELETE", body: confirmation });
    clearSession();
  };

  return (
    <Ctx.Provider value={{ user, loading, offline, retrySession: () => void checkSession(), login, loginWithGoogle, register, logout, refreshUser, updateDisplayName, changePassword, deleteAccount }}>
      {children}
    </Ctx.Provider>
  );
}
