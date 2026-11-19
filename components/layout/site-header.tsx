"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClerkHeaderAuth } from "./clerk-header-auth";
import { ClerkEstimateCount } from "@/components/estimate/clerk-estimate-count";
import { EstimateBasketLink } from "@/components/estimate/estimate-basket-link";
import { clerkEnabled } from "@/lib/env";
import { EstimoLogo } from "./estimo-logo";

export function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const isHome = pathname === "/";
  const isAuthRoute = pathname === "/signin" || pathname === "/signup";
  const isAppRoute = ["/dashboard", "/estimates", "/projects", "/settings"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isAuthRoute || isAppRoute) return null;

  return (
    <header className={isHome ? "topbar is-hero" : "topbar"}>
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="ESTIMO home">
          <EstimoLogo height={26} />
        </Link>
        <nav className="nav">
          <Link className={isActive("/") ? "is-active" : ""} href="/">Home</Link>
          <Link className={isActive("/catalogue") ? "is-active" : ""} href="/catalogue">Catalogue</Link>
          {clerkEnabled ? <ClerkEstimateCount /> : <EstimateBasketLink />}
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

