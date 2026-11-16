"use client";

/** Last-resort boundary when the root layout itself fails. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f1f2ee", color: "#0b1f3f" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8a94a3" }}>
            ESTIMO
          </p>
          <h1 style={{ fontSize: 38, letterSpacing: "-.03em", margin: "8px 0 12px" }}>The app could not start.</h1>
          <p style={{ color: "#5f6b7a", lineHeight: 1.6 }}>
            Reload the page. If it keeps happening, the browser could not load the app bundle.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 18, minHeight: 44, padding: "0 20px", border: 0, borderRadius: 8, background: "#f5b301", color: "#0b1f3f", fontWeight: 700, cursor: "pointer" }}
          >
            Reload
          </button>
          {error.digest ? <p style={{ marginTop: 18, fontSize: 12, color: "#8a94a3" }}>Reference: {error.digest}</p> : null}
        </main>
      </body>
    </html>
  );
}
