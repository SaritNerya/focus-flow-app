import type { ReactNode } from "react";
import Logo from "./Logo";

/** מסגרת משותפת למסכי התחברות והרשמה: לוגו וכרטיס טופס ממורכז על רקע המפה. */
export default function AuthShell({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-brand">
          <Logo />
          <p className="mono">לומדים בקשב</p>
        </div>
        <div className="card auth-card">
          <h1>{title}</h1>
          {lead && <p className="lead">{lead}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
