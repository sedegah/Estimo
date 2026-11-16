"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SsoCallbackPage() {
  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-card">
          <p className="auth-sub">Finishing sign in…</p>
          <AuthenticateWithRedirectCallback />
        </div>
      </main>
    </div>
  );
}
