import type { ReactNode } from "react";
import Link from "next/link";
import { ClerkHeaderAuth } from "@/components/layout/clerk-header-auth";
import { clerkEnabled } from "@/lib/env";

export const metadata = { title: "ESTIMO admin" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          estimo<span>.</span>&nbsp;admin
          <span className="admin-badge">Live app</span>
        </div>
        <div className="admin-user">
          {clerkEnabled ? <ClerkHeaderAuth /> : <Link href="/signin">Sign in</Link>}
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-rail">
          <p className="admin-rail-label">Manage</p>
          <Link className="admin-rail-link" href="/admin/prices">Prices</Link>
          <Link className="admin-rail-link" href="/admin/materials">Materials</Link>
          <Link className="admin-rail-link" href="/admin/settings">Settings</Link>
          <Link className="admin-rail-link" href="/dashboard">Open app</Link>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
