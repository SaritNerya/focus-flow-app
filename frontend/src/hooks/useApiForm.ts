import { useCallback, useState } from "react";
import { ApiError, type FieldErrors } from "../api";

interface RunOptions {
  /** בדיקות מקומיות לפני השליחה לשרת. אם הוחזרו שגיאות — לא שולחים. */
  validate?: () => FieldErrors;
  /** הודעה שתוצג אחרי הצלחה. */
  success?: string;
}

/**
 * מצב משותף לטפסים שמדברים עם השרת: נעילה בזמן שליחה, שגיאות לפי שדה,
 * שגיאה כללית והודעת הצלחה.
 */
export function useApiForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});
  const [success, setSuccess] = useState("");

  /** מריץ את הפעולה ומחזיר true אם הצליחה. */
  const run = useCallback(async (action: () => Promise<void>, opts: RunOptions = {}): Promise<boolean> => {
    setError("");
    setSuccess("");
    const local = opts.validate?.() ?? {};
    setFields(local);
    if (Object.keys(local).length > 0) return false;

    setBusy(true);
    try {
      await action();
      if (opts.success) setSuccess(opts.success);
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields);
        if (Object.keys(err.fields).length === 0) setError(err.message);
      } else setError("אירעה שגיאה. נסו שוב");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, fields, success, run };
}
