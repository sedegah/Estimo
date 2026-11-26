"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/env";

export default function SsoCallbackPage() {
  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-card">
          {clerkEnabled ? (
            <>
              <p className="auth-sub">Finishing sign in…</p>
              <AuthenticateWithRedirectCallback />
            </>
          ) : (
            <>
              <h1 className="auth-title">Sign in is not configured</h1>
              <p className="auth-note">
                This build has no Clerk keys, so there is no social sign-in to finish. Guests can keep
                estimating without an account.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
