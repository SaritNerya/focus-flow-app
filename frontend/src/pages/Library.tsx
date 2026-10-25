import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import Field from "../components/Field";
import type { ContentItem, ContentType } from "../types";

const TYPE_LABEL: Record<ContentType, string> = {
  youtube: "סרטון YouTube",
  text: "טקסט",
  web: "דף אינטרנט",
};

export default function Library() {
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [type, setType] = useState<ContentType>("youtube");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<ContentItem[]>("/api/content").then(setItems).catch((e: ApiError) => setLoadError(e.message));
  }, []);
  useEffect(load, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    setFields({});
    setFormError("");
    setBusy(true);
    try {
      await api("/api/content", { method: "POST", body: { type, title, source } });
      setTitle("");
      setSource("");
      load();
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields);
        if (Object.keys(err.fields).length === 0) setFormError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/content/${id}`, { method: "DELETE" });
      setConfirmId(null);
      load();
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "המחיקה נכשלה");
    }
  }

  return (
    <>
      <h1>הספרייה שלי</h1>
      <div className="grid">
        <section className="card" aria-labelledby="add-h">
          <h2 id="add-h">הוספת פריט חדש</h2>
          <form onSubmit={add} noValidate>
            <Field label="סוג תוכן" htmlFor="type" error={fields.type}>
              <select id="type" value={type} onChange={(e) => { setType(e.target.value as ContentType); setSource(""); }}>
                {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="כותרת" htmlFor="title" error={fields.title}>
              <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            {type === "text" ? (
              <Field label="הטקסט לקריאה" htmlFor="source" error={fields.source} hint="הדביקו כאן מאמר או כל טקסט ארוך">
                <textarea id="source" rows={6} value={source} onChange={(e) => setSource(e.target.value)} />
              </Field>
            ) : (
              <Field label={type === "youtube" ? "קישור לסרטון YouTube" : "קישור לדף אינטרנט"} htmlFor="source" error={fields.source}
                hint={type === "web" ? "נשלוף את הטקסט מהדף ונציג אותו לקריאה" : undefined}>
                <input id="source" type="url" dir="ltr" placeholder="https://" value={source} onChange={(e) => setSource(e.target.value)} />
              </Field>
            )}
            {formError && <p className="error" role="alert">{formError}</p>}
            <button className="btn" type="submit" disabled={busy}>{busy ? "מוסיף…" : "הוספה לספרייה"}</button>
          </form>
        </section>

        <section aria-labelledby="list-h">
          <h2 id="list-h">הפריטים שלי</h2>
          {loadError && <p className="error" role="alert">{loadError}</p>}
          {items === null && !loadError && <p className="muted">טוען…</p>}
          {items?.length === 0 && (
            <div className="card center"><p>הספרייה שלך ריקה. הוסיפו פריט ראשון בטופס.</p></div>
          )}
          <ul className="list">
            {items?.map((it) => (
              <li className="card item" key={it.id}>
                <div>
                  <Link to={`/content/${it.id}`} className="item-title">{it.title}</Link>
                  <div className="muted">{TYPE_LABEL[it.type]} · {new Date(it.created_at).toLocaleDateString("he-IL")}</div>
                </div>
                <div className="actions">
                  <Link className="btn" to={`/content/${it.id}`}>פתיחה</Link>
                  {confirmId === it.id ? (
                    <>
                      <span>למחוק את הפריט?</span>
                      <button className="btn danger" onClick={() => remove(it.id)}>כן, מחיקה</button>
                      <button className="btn secondary" onClick={() => setConfirmId(null)}>ביטול</button>
                    </>
                  ) : (
                    <button className="btn secondary" onClick={() => setConfirmId(it.id)}>מחיקה</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
