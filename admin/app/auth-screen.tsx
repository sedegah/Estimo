"use client";

import { SignIn } from "@clerk/nextjs";

/** Branded sign-in screen: navy brand panel, Clerk card on the right. */
export function AuthScreen() {
  return (
    <div className="auth-split">
      <section className="auth-visual">
        <img className="auth-logo" src="/brand/estimo-logo-horizontal-dark.png" alt="ESTIMO" />
        <div className="auth-copy">
          <span className="auth-eyebrow">Admin console</span>
          <h1>Update prices once.<br />Every estimate follows.</h1>
          <p>Manage the catalogue, publish prices and keep every ESTIMO estimate in step — materials, photos and specifications included.</p>
        </div>
        <span className="auth-foot">Authorised staff only</span>
      </section>

      <section className="auth-panel">
        <SignIn
          routing="hash"
          appearance={{
            variables: {
              colorPrimary: "#f5b301",
              colorForeground: "#17202c",
              colorMutedForeground: "#66707e",
              borderRadius: "10px",
              fontFamily: "Bricolage Grotesque, -apple-system, Segoe UI, Arial, sans-serif",
            },
            elements: {
              card: { boxShadow: "none", border: "1px solid #dfe1d9", background: "#fff" },
              headerTitle: { fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800" },
              formButtonPrimary: { background: "#f5b301", color: "#0b1f3f", fontWeight: "700" },
              footer: { background: "transparent" },
            },
          }}
        />
      </section>
    </div>
  );
}
