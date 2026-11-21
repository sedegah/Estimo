import type { ReactNode } from "react";
import { ClerkBoundary } from "@/components/layout/clerk-boundary";
import { SessionGuard } from "@/components/auth/session-guard";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkBoundary>
      <SessionGuard />
      {children}
    </ClerkBoundary>
  );
}