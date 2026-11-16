import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container page-shell">
      <p className="app-eyebrow">Page not found</p>
      <h1 className="app-title">That page isn’t here.</h1>
      <p className="app-sub">
        The link may be old or mistyped. Everything else is still where you left it.
      </p>
      <div className="chip-row" style={{ marginTop: 22 }}>
        <Link className="btn-amber" href="/dashboard">Go to dashboard</Link>
        <Link className="btn-outline" href="/catalogue">Browse catalogue</Link>
        <Link className="btn-outline" href="/">Home</Link>
      </div>
    </main>
  );
}
