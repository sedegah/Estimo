/** Navy brand panel used by the sign-in and create-account screens. */

export function AuthPanel({ tagline }: { tagline: string }) {
  return (
    <aside className="auth-aside">
      <a href="/" className="auth-brand" aria-label="ESTIMO home">
        <img src="/brand/estimo-logo-horizontal-dark.svg" alt="ESTIMO" height={32} />
      </a>

      <svg className="auth-art" viewBox="0 0 400 300" aria-hidden="true">
        <path d="M60 50V250" stroke="#F1F2EE" strokeWidth="10" strokeLinecap="round" fill="none" />
        <path className="wire" pathLength={1} d="M60 50H300" />
        <path className="wire" pathLength={1} d="M60 150H230" />
        <path className="wire" pathLength={1} d="M60 250H300" />
        <circle className="node" cx="300" cy="50" r="16" fill="#F5B301" />
        <circle className="node" cx="230" cy="150" r="16" fill="#F5B301" />
        <circle className="node" cx="300" cy="250" r="16" fill="#F5B301" />
      </svg>

      <p className="auth-tagline">{tagline}</p>
    </aside>
  );
}
