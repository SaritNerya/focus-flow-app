import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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
const SOURCE_PREVIEW = 80;

/** תיאור קצר של המקור: לקישור — הדומיין (youtube.com), לטקסט — תחילת הטקסט עם "…". */
function sourcePreview(item: ContentItem): string {
  if (item.type === "text") {
    // ברשימה השרת כבר מקצר טקסט ארוך ל-200 תווים ומוסיף "…"
    const flat = item.source.replace(/\s+/g, " ").trim().replace(/…$/, "");
    return flat.length > SOURCE_PREVIEW ? `${flat.slice(0, SOURCE_PREVIEW).trimEnd()}…` : flat;
  }
  try {
    return new URL(item.source).hostname.replace(/^www\./, "");
  } catch {
    return item.source;
  }
}

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
        caption="מסלולים"
        subtitle={items ? (count ? `${count} פריטים ללמידה` : "כאן יופיעו הסרטונים והמאמרים שלכם") : undefined}
      >
        <a href="#add-item" className="btn secondary">+ פריט חדש</a>
      </PageHeader>

      <div className="library-layout">
        <AddItemForm />

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
            <ul className="trail-list stagger">
              {items.map((it, i) => <TrailRow key={it.id} item={it} index={i} onDeleted={load} onError={setLoadError} />)}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

/** טופס הוספת פריט: בחירת סוג, כותרת ומקור. אחרי הוספה מוצלחת עוברים ישר לעמוד הפריט החדש. */
function AddItemForm() {
  const nav = useNavigate();
  const [type, setType] = useState<ContentType>("youtube");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const { busy, error, fields, run } = useApiForm();

  async function submit(e: FormEvent) {
    e.preventDefault();
    let created: ContentItem | undefined;
    const ok = await run(async () => {
      created = await api<ContentItem>("/api/content", { method: "POST", body: { type, title, source } });
    });
    if (ok && created) nav(`/content/${created.id}`);
  }

  function pickType(t: ContentType) {
    setType(t);
    setSource("");
  }

  return (
    <section id="add-item" className="card library-form" aria-labelledby="add-h">
      <h2 id="add-h">הוספת פריט חדש</h2>
      <form onSubmit={submit} noValidate>
        <fieldset className="type-picker">
          <legend>סוג תוכן</legend>
          {(Object.keys(CONTENT_TYPES) as ContentType[]).map((t) => {
            const info = CONTENT_TYPES[t];
            return (
              <label key={t} className="type-option" style={{ "--type-color": info.color } as CSSProperties}>
                <input type="radio" name="type" value={t} checked={type === t} onChange={() => pickType(t)} className="visually-hidden" />
                <span className="type-option__tile"><span className="type-option__chip"><Shape kind={info.shape} color={info.color} /></span>{info.label}</span>
              </label>
            );
          })}
        </fieldset>
        {fields.type && <p className="error" role="alert">{fields.type}</p>}

        <Field label="כותרת" htmlFor="title" error={fields.title}>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: הרצאה על פוטוסינתזה" />
        </Field>

        {type === "text" ? (
          <Field label="הטקסט לקריאה" htmlFor="source" error={fields.source}>
            <textarea id="source" rows={3} value={source} onChange={(e) => setSource(e.target.value)} placeholder="הדביקו כאן מאמר או כל טקסט ארוך" />
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

        <FormStatus error={error} />
        <button className="btn block" type="submit" disabled={busy}>{busy ? "מוסיף…" : "הוספה לספרייה"}</button>
      </form>
    </section>
  );
}

/** שורת שביל: נקודה בצבע הסוג, כותרת, סוג ותאריך, פתיחה ומחיקה עם אישור. */
function TrailRow({ item, index, onDeleted, onError }: { item: ContentItem; index: number; onDeleted: () => void; onError: (m: string) => void }) {
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
    <li className="card lift trail-row" style={{ "--type-color": info.color, "--i": index } as CSSProperties}>
      <span className="trail-row__dot" aria-hidden="true" />
      <div className="trail-row__body">
        <Link to={`/content/${item.id}`} className="trail-row__title">{item.title}</Link>
        <p className="trail-row__source"><bdi>{sourcePreview(item)}</bdi></p>
        <div className="trail-row__meta mono">
          <span className="tag"><Shape kind={info.shape} color={info.color} />{info.label}</span>
          <span>{fmtDay(item.created_at)}</span>
        </div>
      </div>

      <div className="actions trail-row__actions">
        {confirming ? (
          <div className="confirm-inline" role="group" aria-label="אישור מחיקה">
            <p>למחוק את הפריט?</p>
            <div className="actions">
              <button className="btn secondary small" onClick={remove} disabled={busy}>{busy ? "מוחק…" : "כן, מחיקה"}</button>
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
    </li>
  );
}
