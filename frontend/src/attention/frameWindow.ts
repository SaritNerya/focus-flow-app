import { FRAME_SIZE, WINDOW_FRAMES } from "./config";

/** חלון נע של 100 פריימים (חוצץ מעגלי). snapshot() מחזיר אותם לפי סדר הזמן, מוכן להזנת המודל. */
export class FrameWindow {
  private buf = new Float32Array(WINDOW_FRAMES * FRAME_SIZE);
  private head = 0;
  private count = 0;

  push(frame: Float32Array): void {
    this.buf.set(frame, this.head * FRAME_SIZE);
    this.head = (this.head + 1) % WINDOW_FRAMES;
    this.count = Math.min(this.count + 1, WINDOW_FRAMES);
  }

  fill(): number { return this.count / WINDOW_FRAMES; }
  isFull(): boolean { return this.count === WINDOW_FRAMES; }
  clear(): void { this.head = 0; this.count = 0; }

  /** מחזיר עותק [100*478*3] לפי סדר זמן (הישן ביותר ראשון). רק כשהחלון מלא. */
  snapshot(): Float32Array {
    const out = new Float32Array(this.buf.length);
    for (let i = 0; i < WINDOW_FRAMES; i++) {
      const src = ((this.head + i) % WINDOW_FRAMES) * FRAME_SIZE;
      out.set(this.buf.subarray(src, src + FRAME_SIZE), i * FRAME_SIZE);
    }
    return out;
  }
}
