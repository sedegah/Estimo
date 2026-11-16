"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Route-level error boundary: keeps the app usable instead of showing a raw error. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("ESTIMO route error", error);
  }, [error]);

  return (
    <main className="container page-shell">
      <p className="app-eyebrow">Something went wrong</p>
      <h1 className="app-title">This page hit a problem.</h1>
      <p className="app-sub">
        Your saved estimates and basket are untouched — they live in this browser. Try again, or head back to the
        dashboard.
      </p>
      <div className="chip-row" style={{ marginTop: 22 }}>
        <button className="btn-amber" type="button" onClick={reset}>Try again</button>
        <Link className="btn-outline" href="/dashboard">Dashboard</Link>
        <Link className="btn-outline" href="/">Home</Link>
      </div>
      {error.digest ? <p className="page-note">Reference: {error.digest}</p> : null}
    </main>
  );
}
