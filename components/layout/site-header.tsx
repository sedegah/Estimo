"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderAuth } from "./header-auth";
import { HeaderTools } from "./header-tools";
import { EstimoLogo } from "./estimo-logo";

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const isHeroPage = pathname === "/" || pathname.startsWith("/itemized");
  const isAuthRoute = pathname === "/signin" || pathname === "/signup";
  const isAppRoute = ["/dashboard", "/estimates", "/projects", "/settings"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isAuthRoute || isAppRoute) return null;

  return (
    <header className={isHeroPage ? "topbar is-hero" : "topbar"}>
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="ESTIMO home">
          <EstimoLogo height={26} />
        </Link>
        <nav className="nav">
          {/* a guest header carries Saved estimates, so the logo is Home; signed-in users
              keep the explicit Home item */}
          {signedIn ? <Link className={isActive("/") ? "is-active" : ""} href="/">Home</Link> : null}
          <Link className={isActive("/catalogue") ? "is-active" : ""} href="/catalogue">Catalogue</Link>
        </nav>
        <div className="topbar-auth">
          <HeaderAuth signedIn={signedIn} />
          <HeaderTools />
        </div>
      </div>
    </header>
  );
}
