"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderAuth } from "./header-auth";
import { EstimateBasketLink } from "@/components/estimate/estimate-basket-link";
import { EstimoLogo } from "./estimo-logo";

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
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
          <Link className={isActive("/quantities") ? "is-active" : ""} href="/quantities">Quantities</Link>
          <EstimateBasketLink />
        </nav>
        <div className="topbar-auth">
          <HeaderAuth signedIn={signedIn} />
        </div>
      </div>
    </header>
  );
}