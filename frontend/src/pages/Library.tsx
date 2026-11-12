import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import { CONTENT_TYPES } from "../contentTypes";
import EmptyState from "../components/EmptyState";
import Field from "../components/Field";
import FormStatus from "../components/FormStatus";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import Shape from "../components/Shape";
import { useApiForm } from "../hooks/useApiForm";
import type { ContentItem, ContentType } from "../types";

const fmtDay = (s: string) => new Date(s).toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });

export default function Library() {
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(() => {
    api<ContentItem[]>("/api/content").then(setItems).catch((e: ApiError) => setLoadError(e.message));
  }, []);
  useEffect(load, [load]);

  const count = items?.length ?? 0;

  return (
    <>
      <PageHeader
        title="הספרייה שלי"
        shape="circle"
        color="var(--red)"
        subtitle={items ? (count ? `${count} פריטים ללמידה` : "כאן יופיעו הסרטונים והמאמרים שלכם") : undefined}
      >
        <a href="#add-item" className="btn accent">+ פריט חדש</a>
      </PageHeader>

      <div className="library-layout">
        <AddItemForm onAdded={load} />

        <section aria-labelledby="list-h">
          <h2 id="list-h" className="visually-hidden">הפריטים שלי</h2>
          {loadError && <p className="error" role="alert">{loadError}</p>}
          {items === null && !loadError && <Loader />}
          {items?.length === 0 && (
            <EmptyState title="הספרייה עדיין ריקה">
              הוסיפו סרטון YouTube, טקסט או קישור לדף — ותתחילו סשן למידה ממוקד.
            </EmptyState>
          )}
          {items && items.length > 0 && (
            <ul className="content-grid">
              {items.map((it) => <ContentCard key={it.id} item={it} onDeleted={load} onError={setLoadError} />)}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

/** טופס הוספת פריט: בחירת סוג באריחים, כותרת ומקור. */
function AddItemForm({ onAdded }: { onAdded: () => void }) {
  const [type, setType] = useState<ContentType>("youtube");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const { busy, error, fields, success, run } = useApiForm();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const ok = await run(() => api("/api/content", { method: "POST", body: { type, title, source } }), {
      success: "הפריט נוסף לספרייה",
    });
    if (!ok) return;
    setTitle("");
    setSource("");
    onAdded();
  }

  function pickType(t: ContentType) {
    setType(t);
    setSource("");
  }

  return (
    <section id="add-item" className="card library-form pop-yellow" aria-labelledby="add-h">
      <h2 id="add-h">הוספת פריט חדש</h2>
      <form onSubmit={submit} noValidate>
        <fieldset className="type-picker">
          <legend>סוג תוכן</legend>
          {(Object.keys(CONTENT_TYPES) as ContentType[]).map((t) => {
            const info = CONTENT_TYPES[t];
            return (
              <label key={t} className="type-option" style={{ "--type-soft": info.soft } as CSSProperties}>
                <input type="radio" name="type" value={t} checked={type === t} onChange={() => pickType(t)} className="visually-hidden" />
                <span className="type-option__tile"><Shape kind={info.shape} color={info.color} outline />{info.label}</span>
              </label>
            );
          })}
        </fieldset>
        {fields.type && <p className="error" role="alert">{fields.type}</p>}

        <Field label="כותרת" htmlFor="title" error={fields.title}>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: הרצאה על פוטוסינתזה" />
        </Field>

        {type === "text" ? (
          <Field label="הטקסט לקריאה" htmlFor="source" error={fields.source} hint="הדביקו כאן מאמר או כל טקסט ארוך">
            <textarea id="source" rows={6} value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
        ) : (
          <Field
            label={type === "youtube" ? "קישור לסרטון YouTube" : "קישור לדף אינטרנט"}
            htmlFor="source"
            error={fields.source}
            hint={type === "web" ? "נשלוף את הטקסט מהדף ונציג אותו לקריאה" : undefined}
          >
            <input id="source" type="url" dir="ltr" placeholder="https://" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
        )}

        <FormStatus error={error} success={success} />
        <button className="btn block" type="submit" disabled={busy}>{busy ? "מוסיף…" : "הוספה לספרייה"}</button>
      </form>
    </section>
  );
}

/** כרטיס פריט: פס צבעוני לפי סוג, כותרת, תאריך, פתיחה ומחיקה עם אישור. */
function ContentCard({ item, onDeleted, onError }: { item: ContentItem; onDeleted: () => void; onError: (m: string) => void }) {
  const info = CONTENT_TYPES[item.type];
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await api(`/api/content/${item.id}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "המחיקה נכשלה");
      setBusy(false);
    }
  }

  return (
    <li className="content-card" style={{ "--type-color": info.color } as CSSProperties}>
      <div className="content-card__band">
        <Shape kind={info.shape} color="var(--surface)" outline />
      </div>
      <div className="content-card__body">
        <Link to={`/content/${item.id}`} className="content-card__title">{item.title}</Link>
        <div className="content-card__meta">
          <span className="tag"><Shape kind={info.shape} color={info.color} outline />{info.label}</span>
          <span>{fmtDay(item.created_at)}</span>
        </div>

        <div className="actions">
          {confirming ? (
            <div className="confirm-inline" role="group" aria-label="אישור מחיקה">
              <p>למחוק את הפריט?</p>
              <div className="actions">
                <button className="btn danger small" onClick={remove} disabled={busy}>{busy ? "מוחק…" : "כן, מחיקה"}</button>
                <button className="btn secondary small" onClick={() => setConfirming(false)} disabled={busy}>ביטול</button>
              </div>
            </div>
          ) : (
            <>
              <Link className="btn small" to={`/content/${item.id}`}>פתיחה</Link>
              <button className="btn secondary small" onClick={() => setConfirming(true)} aria-label={`מחיקת ${item.title}`}>מחיקה</button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
