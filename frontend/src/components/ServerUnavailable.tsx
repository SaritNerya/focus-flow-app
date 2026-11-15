import { useAuth } from "../auth";
import Logo from "./Logo";

/** השרת לא זמין בבדיקת הטוקן (רשת/500): הטוקן נשמר, ולא מעבירים להתחברות — מציעים לנסות שוב. */
export default function ServerUnavailable() {
  const { retrySession } = useAuth();
  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-brand"><Logo /></div>
        <div className="card auth-card" role="alert">
          <h1>אין חיבור לשרת</h1>
          <p className="lead">לא הצלחנו להתחבר לשרת. ייתכן שהוא לא פועל כרגע או שאין חיבור לאינטרנט. את עדיין מחוברת לחשבון.</p>
          <button type="button" className="btn block" onClick={retrySession}>נסי שוב</button>
        </div>
      </main>
    </div>
  );
}
