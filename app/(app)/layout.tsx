import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

/** Shared shell for every in-app route: dashboard, estimates, projects, catalogue, settings. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
