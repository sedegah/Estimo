"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { EstimoLogo } from "@/components/layout/estimo-logo";

const NAV: { href: string; label: string; short: string; icon: ReactNode }[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    short: "Home",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
      </svg>
    ),
  },
  {
    href: "/estimates",
    label: "Estimates",
    short: "Estimates",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    href: "/projects",
    label: "Saved projects",
    short: "Projects",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/catalogue",
    label: "Catalogue",
    short: "Prices",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z" />
        <path d="M3 7.5 12 12l9-4.5M12 12v9" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    short: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M8 14v6" />
      </svg>
    ),
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <div className="app-rail-top">
          <Link href="/" className="app-rail-brand" aria-label="ESTIMO home">
            <EstimoLogo height={24} />
          </Link>
          <div className="app-rail-footer">
            <SignOutButton />
          </div>
        </div>
        <nav className="app-rail-nav">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={active ? "app-rail-link is-active" : "app-rail-link"}>
                <span className="app-nav-icon">{item.icon}</span>
                <span className="app-nav-label">{item.label}</span>
                <span className="app-nav-short">{item.short}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="app-main">{children}</div>
    </div>
  );
}
