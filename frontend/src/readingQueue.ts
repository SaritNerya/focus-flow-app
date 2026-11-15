import { ApiError } from "./api";

export interface Reading { position: number; score: number }

export interface ReadingQueueEvents {
  /** מדידה נשמרה. pending = כמה ממתינות עדיין בתור. */
  onSaved(pending: number): void;
  /** שליחה נכשלה וננסה שוב בעוד delayMs. */
  onRetrying(pending: number, delayMs: number): void;
  /** מדידה ויתרנו עליה (נכשלה אחרי כל הניסיונות, או שהתור התמלא). */
  onDropped(): void;
  /** השרת החזיר 409: הסשן נסגר או הגיע למגבלת המדידות. התור נעצר. */
  onClosed(): void;
}

export const MAX_QUEUE = 50;
export const MAX_RETRIES = 3;
export const RETRY_BASE_MS = 1000; // 1s, 2s, 4s

/** שגיאה זמנית שכדאי לנסות שוב: אין רשת (0), עומס (429) או תקלה בשרת (5xx). */
const isTransient = (e: unknown) => e instanceof ApiError && (e.status === 0 || e.status === 429 || e.status >= 500);

/**
 * תור קטן לשליחת מדידות לשרת, לפי הסדר. מדידה שנכשלה בשגיאה זמנית נשלחת שוב עד MAX_RETRIES פעמים
 * בהשהיה הולכת וגדלה. 409 עוצר את התור לגמרי. אם התור מלא, המדידה הישנה ביותר נזרקת.
 */
export class ReadingQueue {
  private items: { reading: Reading; attempts: number }[] = [];
  private sending = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(private send: (r: Reading) => Promise<unknown>, private events: ReadingQueueEvents) {}

  add(reading: Reading): void {
    if (this.stopped) return;
    this.items.push({ reading, attempts: 0 });
    if (this.items.length > MAX_QUEUE) {
      this.items.shift();
      this.events.onDropped();
    }
    if (!this.retryTimer) void this.flush(); // בזמן המתנה לניסיון חוזר — רק מצטרפים לתור
  }

  stop(): void {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.items = [];
  }

  private async flush(): Promise<void> {
    if (this.sending || this.stopped) return;
    this.sending = true;
    try {
      while (this.items.length && !this.stopped) {
        const head = this.items[0];
        try {
          await this.send(head.reading);
          this.items.shift();
          this.events.onSaved(this.items.length);
        } catch (e) {
          if (e instanceof ApiError && e.status === 409) {
            this.stop();
            this.events.onClosed();
            return;
          }
          if (!isTransient(e) || head.attempts >= MAX_RETRIES) {
            this.items.shift(); // שגיאה קבועה, או שנגמרו הניסיונות
            this.events.onDropped();
            continue;
          }
          head.attempts++;
          const delay = RETRY_BASE_MS * 2 ** (head.attempts - 1);
          this.events.onRetrying(this.items.length, delay);
          this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            void this.flush();
          }, delay);
          return;
        }
      }
    } finally {
      this.sending = false;
    }
  }
}
