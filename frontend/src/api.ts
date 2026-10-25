import { API_URL } from "./config";

const TOKEN_KEY = "ff_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) {
    super(message);
  }
}

interface Options { method?: string; body?: unknown; auth?: boolean }

export async function api<T>(path: string, { method = "GET", body, auth = true }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, "אין חיבור לשרת. בדקו את החיבור ונסו שוב");
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth) {
      setToken(null);
      window.dispatchEvent(new Event("auth:unauthorized")); // הלקוח יעביר להתחברות
    }
    throw new ApiError(res.status, data.message ?? "אירעה שגיאה. נסו שוב", data.fields ?? {});
  }
  return data as T;
}
