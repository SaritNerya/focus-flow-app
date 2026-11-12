/** הודעת שגיאה כללית / הצלחה של טופס. */
export default function FormStatus({ error, success }: { error?: string; success?: string }) {
  if (error) return <p className="error" role="alert">{error}</p>;
  if (success) return <p className="success" role="status">{success}</p>;
  return null;
}
