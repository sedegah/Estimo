import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkEnabled, env } from "@/lib/env";

/**
 * Mounts Clerk where it is needed. `enabled` lets the root layout stay free of
 * Clerk for anonymous visitors on public pages, while the app shell and the auth
 * pages always pass `enabled`.
 */
export function ClerkBoundary({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  if (!enabled || !clerkEnabled) return <>{children}</>;
  return (
    <ClerkProvider publishableKey={env.clerkPublishableKey} afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  );
}
