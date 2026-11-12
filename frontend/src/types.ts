export interface User {
  id: string; email: string; display_name: string; created_at: string;
  has_password: boolean; // false = משתמש שנרשם עם Google ואין לו סיסמה
}
export interface TokenOut { access_token: string; token_type: string; expires_in: number }
export type ContentType = "youtube" | "text" | "web";
export interface ContentItem {
  id: string; title: string; type: ContentType; source: string; created_at: string;
  text?: string | null; youtube_id?: string | null;
  embed_url?: string | null; // דף אינטרנט שמותר להציג בתוך האתר
}
export interface SessionSummary {
  id: string; content_id: string; content_title?: string | null; content_type?: string | null;
  started_at: string; ended_at?: string | null; reading_count: number; average_score?: number | null;
}
export interface Reading { position: number; score: number; created_at: string }
export interface SessionDetail extends SessionSummary { readings: Reading[] }
