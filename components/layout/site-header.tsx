"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EstimateBasketLink } from "@/components/estimate/estimate-basket-link";
import { ClerkHeaderAuth } from "./clerk-header-auth";
import { clerkEnabled } from "@/lib/env";
import { EstimoLogo } from "./estimo-logo";

export function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const isAuthRoute = pathname === "/signin" || pathname === "/signup";
  const isAppRoute = ["/dashboard", "/estimates", "/projects", "/settings"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isAuthRoute || isAppRoute) return null;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="ESTIMO home">
          <EstimoLogo height={26} />
        </Link>
        <nav className="nav">
          <Link className={isActive("/") ? "is-active" : ""} href="/">Home</Link>
          <Link className={isActive("/catalogue") ? "is-active" : ""} href="/catalogue">Catalogue</Link>
          <EstimateBasketLink />
          {clerkEnabled ? (
            <ClerkHeaderAuth />
          ) : (
            <Link className="nav-signin" href="/dashboard">Dashboard</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

