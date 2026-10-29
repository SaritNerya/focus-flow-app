// רץ אוטומטית לפני `npm run dev` ו-`npm run build` (prebuild / predev).
// 1. מעתיק את קבצי ה-WASM של MediaPipe ושל onnxruntime-web מ-node_modules אל public/
// 2. מוריד פעם אחת את face_landmarker.task (אם חסר) ל-public/models/
// 3. מוודא שמודל הקשב (v4_2.onnx) קיים
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");

function copyDir(src, dest, accept = () => true) {
  mkdirSync(dest, { recursive: true });
  for (const f of readdirSync(src)) if (accept(f)) cpSync(join(src, f), join(dest, f));
}

copyDir(join(root, "node_modules/@mediapipe/tasks-vision/wasm"), join(pub, "mediapipe/wasm"));
copyDir(join(root, "node_modules/onnxruntime-web/dist"), join(pub, "ort"), (f) =>
  /^ort-wasm-simd-threaded\.(mjs|wasm)$/.test(f),
);

const modelsDir = join(pub, "models");
mkdirSync(modelsDir, { recursive: true });

const FACE_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const facePath = join(modelsDir, "face_landmarker.task");
if (!existsSync(facePath)) {
  console.log("מוריד את face_landmarker.task (פעם אחת)…");
  try {
    const res = await fetch(FACE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    writeFileSync(facePath, Buffer.from(await res.arrayBuffer()));
  } catch (e) {
    console.error(`\n[שגיאה] ההורדה נכשלה (${e.message}).\nהורידו ידנית את הקובץ:\n  ${FACE_URL}\nושמרו אותו בשם:\n  ${facePath}\n`);
    process.exit(1);
  }
}

const attention = join(modelsDir, "v4_2.onnx");
if (!existsSync(attention) || statSync(attention).size < 1_000_000) {
  console.error(`\n[שגיאה] חסר מודל הקשב. העתיקו את v4_2.onnx אל:\n  ${attention}\n`);
  process.exit(1);
}
console.log("assets OK");
