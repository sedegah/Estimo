"use client";

import { SignIn } from "@clerk/nextjs";

export function AdminSignIn() {
  return (
    <div className="admin-auth">
      <div className="admin-auth-card">
        <h1>Sign in to admin</h1>
        <p>Use the ESTIMO account that is allowed to edit prices. Everyone else can still use the app.</p>
        <SignIn routing="hash" />
      </div>
    </div>
  );
}
