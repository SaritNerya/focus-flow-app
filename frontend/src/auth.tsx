import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";
import type { TokenOut, User } from "./types";

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, display_name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateDisplayName: (display_name: string) => Promise<void>;
  changePassword: (current_password: string, new_password: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const Ctx = createContext<AuthValue>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getToken()); // רענון הדף לא מתנתק

  const refreshUser = useCallback(async () => setUser(await api<User>("/api/users/me")), []);

  useEffect(() => {
    if (!getToken()) return;
    refreshUser().catch(() => setToken(null)).finally(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    const t = await api<TokenOut>("/api/auth/login", { method: "POST", body: { email, password }, auth: false });
    setToken(t.access_token);
    await refreshUser();
  };
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
  // השרת פוסל את כל הטוקנים הישנים ומחזיר טוקן חדש — כך נשארים מחוברים רק במכשיר הזה
  const changePassword = async (current_password: string, new_password: string) => {
    const t = await api<TokenOut>("/api/users/me/password", { method: "POST", body: { current_password, new_password } });
    setToken(t.access_token);
  };
  const deleteAccount = async (password: string) => {
    await api("/api/users/me", { method: "DELETE", body: { password } });
    clearSession();
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refreshUser, updateDisplayName, changePassword, deleteAccount }}>
      {children}
    </Ctx.Provider>
  );
}
