import { FPS, INFER_EVERY_MS, MISSING_TO_FLAG, MISSING_TO_RESET } from "./config";
import { FaceTracker } from "./faceTracker";
import { FrameWindow } from "./frameWindow";
import { loadModel, predict, type Prediction } from "./model";

export interface AttentionCallbacks {
  onScore(p: Prediction): void;
  /** faceFound=false אחרי כ-0.3 שנ' בלי פנים. fill = כמה מהחלון (0..1) כבר נאסף. */
  onFrame(faceFound: boolean, fill: number): void;
  onError(message: string): void;
}

/**
 * מנהל את כל הצינור: מצלמה -> MediaPipe (10 פריימים/שנ') -> חלון נע של 100 -> מודל -> ציון.
 * הווידאו והנקודות נשארים בדפדפן. החוצה יוצא רק הציון (באחריות הקורא).
 */
export class AttentionController {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private tracker: FaceTracker | null = null;
  private timer: number | null = null;
  private win = new FrameWindow();
  private missing = 0;
  private busy = false;
  private lastInfer = 0;
  private stopped = false;

  constructor(private cb: AttentionCallbacks) {}

  /** שלב 1: מבקש הרשאה ומפעיל את המצלמה. זורק NotAllowedError אם המשתמש סירב. */
  async startCamera(video: HTMLVideoElement): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    video.srcObject = this.stream;
    await video.play();
    this.video = video;
  }

  /** שלב 2: טוען את MediaPipe ואת מודל הקשב ומתחיל למדוד. */
  async startMeasuring(): Promise<void> {
    const [tracker] = await Promise.all([FaceTracker.create(), loadModel()]);
    if (this.stopped) { tracker.close(); return; }
    this.tracker = tracker;
    this.timer = window.setInterval(() => this.tick(), 1000 / FPS);
  }

  private tick(): void {
    const v = this.video;
    if (this.stopped || !v || !this.tracker || v.readyState < 2 || v.videoWidth === 0) return;

    const frame = this.tracker.detect(v);
    if (!frame) {
      this.missing++;
      if (this.missing >= MISSING_TO_RESET) this.win.clear();
      if (this.missing >= MISSING_TO_FLAG) this.cb.onFrame(false, this.win.fill());
      return; // אין פנים: לא מריצים את המודל
    }
    this.missing = 0;
    this.win.push(frame);
    this.cb.onFrame(true, this.win.fill());

    const now = performance.now();
    if (this.win.isFull() && !this.busy && now - this.lastInfer >= INFER_EVERY_MS) {
      void this.infer(now);
    }
  }

  private async infer(now: number): Promise<void> {
    this.busy = true;
    this.lastInfer = now;
    try {
      const p = await predict(this.win.snapshot());
      if (!this.stopped) this.cb.onScore(p);
    } catch {
      this.cb.onError("חישוב ציון הקשב נכשל. המדידה תמשיך לנסות.");
    } finally {
      this.busy = false;
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.stream?.getTracks().forEach((t) => t.stop()); // מכבה את המצלמה
    if (this.video) this.video.srcObject = null;
    this.tracker?.close();
    this.tracker = null;
    this.win.clear();
  }
}
