"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

/**
 * Header auth controls when Clerk is configured.
 * Signing in is optional; once signed in the control becomes "Dashboard".
 */
export function ClerkHeaderAuth() {
  return (
    <>
      <Show when="signed-out">
        <Link className="nav-signin" href="/signin">Sign in</Link>
      </Show>
      <Show when="signed-in">
        <Link className="nav-signin" href="/dashboard">Dashboard</Link>
        <UserButton />
      </Show>
    </>
  );
}
