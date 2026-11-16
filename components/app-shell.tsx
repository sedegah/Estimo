"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { EstimoLogo } from "@/components/layout/estimo-logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/estimates", label: "Estimates" },
  { href: "/projects", label: "Saved projects" },
  { href: "/dashboard/catalogue", label: "Catalogue" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <Link href="/" className="app-rail-brand" aria-label="ESTIMO home">
          <EstimoLogo height={24} />
        </Link>
        <nav className="app-rail-nav">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={active ? "app-rail-link is-active" : "app-rail-link"}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="app-rail-footer">
          <SignOutButton />
        </div>
      </aside>
      <div className="app-main">{children}</div>
    </div>
  );
}

