import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { ClerkBoundary } from "@/components/layout/clerk-boundary";
import { SessionGuard } from "@/components/auth/session-guard";

/** Shared shell for every in-app route: dashboard, estimates, projects, catalogue, settings. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkBoundary>
      <SessionGuard />
      <AppShell>{children}</AppShell>
    </ClerkBoundary>
  );
}