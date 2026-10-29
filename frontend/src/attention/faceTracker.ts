import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FACE_MODEL_URL, FRAME_SIZE, LANDMARKS, MEDIAPIPE_WASM_PATH } from "./config";

/** עוטף את MediaPipe FaceLandmarker: מחזיר 478 נקודות גולמיות (x,y,z) או null אם אין פנים. */
export class FaceTracker {
  private lastTs = 0;
  private constructor(private lm: FaceLandmarker) {}

  static async create(): Promise<FaceTracker> {
    const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
    const lm = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "CPU" },
      runningMode: "VIDEO",
      numFaces: 1,
    });
    return new FaceTracker(lm);
  }

  detect(video: HTMLVideoElement): Float32Array | null {
    const ts = Math.max(performance.now(), this.lastTs + 1); // חייב לעלות בכל קריאה
    this.lastTs = ts;
    const pts = this.lm.detectForVideo(video, ts).faceLandmarks?.[0];
    if (!pts || pts.length !== LANDMARKS) return null;
    const out = new Float32Array(FRAME_SIZE);
    for (let i = 0; i < LANDMARKS; i++) {
      out[i * 3] = pts[i].x;
      out[i * 3 + 1] = pts[i].y;
      out[i * 3 + 2] = pts[i].z;
    }
    return out;
  }

  close(): void { this.lm.close(); }
}
