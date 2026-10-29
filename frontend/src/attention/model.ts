import * as ort from "onnxruntime-web/wasm";
import { LANDMARKS, MODEL_URL, ORT_WASM_PATH, WINDOW_FRAMES } from "./config";

ort.env.wasm.wasmPaths = ORT_WASM_PATH;
ort.env.wasm.numThreads = 1; // ריבוי תהליכונים דורש כותרות COOP/COEP; חלון אחד לוקח כ-50ms גם כך

let sessionPromise: Promise<ort.InferenceSession> | null = null;

/** טוען את מודל הקשב פעם אחת בלבד. */
export function loadModel(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL_URL, { executionProviders: ["wasm"] }).catch((e) => {
      sessionPromise = null; // מאפשר ניסיון חוזר
      throw e;
    });
  }
  return sessionPromise;
}

export interface Prediction {
  score: number;        // 0..1, גבוה = קשב גבוה
  level: number | null; // 0..4 (לא במצלמה, לא קשוב, קשב חלש, קשוב, קשוב מאוד) או null
}

export async function predict(window: Float32Array): Promise<Prediction> {
  const session = await loadModel();
  const input = new ort.Tensor("float32", window, [1, WINDOW_FRAMES, LANDMARKS, 3]);
  const outputs = await session.run({ [session.inputNames[0]]: input }); // שם הקלט שונה בין גרסאות
  const names = session.outputNames;
  const scoreName = names.includes("regression_scores") ? "regression_scores" : names[0];
  const raw = (outputs[scoreName].data as Float32Array)[0];
  const score = Math.min(1, Math.max(0, raw));

  let level: number | null = null;
  const logits = outputs["classification_logits"]?.data as Float32Array | undefined;
  if (logits && logits.length) level = logits.indexOf(Math.max(...logits));
  return { score, level };
}
