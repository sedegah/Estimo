import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { AuthPanel } from "@/components/auth/auth-panel";
import { clerkEnabled } from "@/lib/env";

const appearance = {
  variables: {
    colorPrimary: "#f5b301",
    colorText: "#0b1f3f",
    colorTextSecondary: "#5f6b7a",
    fontFamily: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
    borderRadius: "8px",
  },
  elements: {
    card: { boxShadow: "none", border: "1px solid #e2e4dc", background: "#ffffff" },
    headerTitle: { fontWeight: "800", letterSpacing: "-.02em" },
  },
};

export default function SignUpPage() {
  return (
    <div className="auth-page">
      <AuthPanel tagline="Estimate once. Come back to it anytime." />
      <main className="auth-main">
        <div className="auth-card">
          {clerkEnabled ? (
            <SignUp routing="hash" signInUrl="/signin" fallbackRedirectUrl="/dashboard" appearance={appearance} />
          ) : (
            <>
              <h1 className="auth-title">Create your account</h1>
              <p className="auth-sub">Authentication is not configured on this build.</p>
              <p className="auth-note">
                Add Clerk keys to <code>.env</code> and restart the server. Guests can keep estimating without an
                account.
              </p>
              <p className="auth-switch">
                <Link className="auth-link" href="/">Back to ESTIMO</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
