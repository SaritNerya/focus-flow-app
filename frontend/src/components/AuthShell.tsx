import type { ReactNode } from "react";
import Logo from "./Logo";

/** פוסטר באוהאוס לצד מסכי ההתחברות — קומפוזיציה של צורות וצבעי יסוד. */
function Poster() {
  const line = { stroke: "var(--ink)", strokeWidth: 6, strokeLinejoin: "round" as const };
  return (
    <svg className="poster" viewBox="0 0 400 600" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      <rect x="306" y="0" width="12" height="300" fill="var(--ink)" />
      <circle cx="262" cy="150" r="112" fill="var(--yellow)" {...line} />
      <rect x="36" y="64" width="128" height="128" fill="var(--red)" {...line} />
      <rect x="0" y="292" width="300" height="16" fill="var(--ink)" />
      <polygon points="56,292 128,196 200,292" fill="var(--paper)" {...line} />
      <circle cx="352" cy="300" r="34" fill="var(--paper)" {...line} />
      <path d="M262 38 A112 112 0 0 1 374 150 L262 150 Z" fill="var(--red)" {...line} />
    </svg>
  );
}

/** מסגרת משותפת למסכי התחברות והרשמה: פוסטר + כרטיס טופס. */
export default function AuthShell({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="auth-page">
      <aside className="auth-art">
        <Poster />
        <Logo withMark={false} />
        <h2>לומדים<br />בקשב.</h2>
        <p>FocusFlow מודד את רמת הקשב שלכם דרך המצלמה, ועוזר לכם להישאר ממוקדים בסרטונים ובמאמרים.</p>
      </aside>
      <main className="auth-main">
        <div className="card auth-card pop-yellow">
          <h1>{title}</h1>
          {lead && <p className="lead">{lead}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
