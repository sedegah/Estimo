"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

/**
 * Clerk's header controls are fetched only when the visitor already has a session.
 * An anonymous visitor gets Saved estimates and Sign in, so it ships no Clerk JavaScript.
 */
const ClerkHeaderAuth = dynamic(() => import("./clerk-header-auth").then((module) => module.ClerkHeaderAuth), {
  ssr: false,
});

export function HeaderAuth({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const onSaved = pathname === "/saved" || pathname.startsWith("/saved/");

  if (!signedIn) {
    return (
      <>
        <Link className={`nav-saved${onSaved ? " is-active" : ""}`} href="/saved">
          Saved estimates
        </Link>
        <Link className="nav-signin" href="/signin">
          Sign in
        </Link>
      </>
    );
  }
  return <ClerkHeaderAuth />;
}
