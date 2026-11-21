"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

/**
 * Clerk's header controls are fetched only when the visitor already has a session.
 * An anonymous visitor gets a plain link, so public pages ship no Clerk JavaScript.
 */
const ClerkHeaderAuth = dynamic(() => import("./clerk-header-auth").then((module) => module.ClerkHeaderAuth), {
  ssr: false,
});

export function HeaderAuth({ signedIn }: { signedIn: boolean }) {
  if (!signedIn) {
    return <Link className="nav-signin" href="/signin">Sign in</Link>;
  }
  return <ClerkHeaderAuth />;
}
