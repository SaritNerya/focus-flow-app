import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";
import type { User } from "./types";

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, display_name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
    const t = await api<{ access_token: string }>("/api/auth/login", { method: "POST", body: { email, password }, auth: false });
    setToken(t.access_token);
    await refreshUser();
  };
  const register = async (email: string, password: string, display_name: string) => {
    await api("/api/auth/register", { method: "POST", body: { email, password, display_name }, auth: false });
  };
  const logout = async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } catch { /* מתנתקים מקומית בכל מקרה */ }
    setToken(null);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refreshUser }}>{children}</Ctx.Provider>;
}
