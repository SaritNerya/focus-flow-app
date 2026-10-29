/** קבועי צינור הקשב. המודל אומן על 100 פריימים ב-10 לשנייה (כ-10 שניות). */
export const MODEL_URL = "/models/v4_2.onnx";          // גרסה עם משקלי Attention (v4_2 ומעלה)
export const FACE_MODEL_URL = "/models/face_landmarker.task";
export const MEDIAPIPE_WASM_PATH = "/mediapipe/wasm";
export const ORT_WASM_PATH = "/ort/";

export const LANDMARKS = 478;                           // MediaPipe Face Mesh (כולל קשתית)
export const FRAME_SIZE = LANDMARKS * 3;                // x, y, z לכל נקודה
export const WINDOW_FRAMES = 100;
export const FPS = 10;
export const WINDOW_SECONDS = WINDOW_FRAMES / FPS;

export const INFER_EVERY_MS = 3000;                     // כל כמה זמן מריצים את המודל על החלון הנע
export const LOW_FOCUS_THRESHOLD = 0.4;                 // מתחת לזה מופיעה התראה

export const MISSING_TO_FLAG = 3;                       // כמה פריימים בלי פנים עד "לא זוהו פנים" (~0.3 שנ')
export const MISSING_TO_RESET = 10;                     // כמה פריימים בלי פנים עד איפוס החלון (~1 שנ')
