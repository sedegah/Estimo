"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/env";

/**
 * Header auth controls when Clerk is configured.
 * Signing in is optional; once signed in the control becomes "Dashboard".
 * A build without keys never mounts this, because there is no provider to read.
 */
export function ClerkHeaderAuth() {
  if (!clerkEnabled) return null;
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
