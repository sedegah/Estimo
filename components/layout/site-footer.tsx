"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openCookieNotice } from "@/lib/cookie-notice";
import { EstimoLogo } from "./estimo-logo";

const AUTH_ROUTES = ["/signin", "/signup", "/sso-callback"];
const APP_ROUTES = ["/dashboard", "/estimates", "/projects", "/settings"];

const ENQUIRIES_NUMBER = "+233 26 400 5400";
const ENQUIRIES_HREF = "tel:+233264005400";

export function SiteFooter({ year }: { year: number }) {
  const pathname = usePathname();

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isAppRoute = APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isAuthRoute || isAppRoute) return null;

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-lead">
          <Link href="/" className="footer-brand" aria-label="ESTIMO home">
            <EstimoLogo height={28} />
          </Link>
          <p className="footer-tagline">
            Estimate smarter.
            <br />
            Build better.
          </p>
          <p className="footer-blurb">
            Electrical estimating for homes, shops and workspaces across Ghana — with material prices you can
            check before the work starts.
          </p>
          <a
            className="footer-call"
            href={ENQUIRIES_HREF}
            aria-label={`Call ESTIMO enquiries on ${ENQUIRIES_NUMBER}`}
          >
            <span className="footer-call-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.7 3.5h2.1l1.1 3.6-1.8 1.3a15.4 15.4 0 0 0 6.3 6.3l1.3-1.8 3.6 1.1v2.1a1.9 1.9 0 0 1-1.9 1.9A15.2 15.2 0 0 1 4.8 5.4a1.9 1.9 0 0 1 1.9-1.9Z" />
              </svg>
            </span>
            <span className="footer-call-copy">
              <span className="footer-call-label">Enquiries</span>
              <strong className="footer-call-number">{ENQUIRIES_NUMBER}</strong>
            </span>
          </a>
        </div>

        <nav className="footer-columns" aria-label="Footer">
          <div className="footer-col">
            <h2>Estimate</h2>
            <Link href="/quick-estimate?template=HOME-2B">Start an estimate</Link>
            <Link href="/catalogue">Material catalogue</Link>
          </div>
          <div className="footer-col">
            <h2>Your work</h2>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/projects">Saved projects</Link>
          </div>
        </nav>
      </div>

      <div className="footer-base">
        <div className="footer-base-inner">
          <p>© {year} ESTIMO · Electrical estimating for Ghana</p>
          <nav className="footer-legal" aria-label="Legal and cookie settings">
            <Link href="/privacy">Privacy</Link>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={openCookieNotice}>Cookies</button>
          </nav>
          <p className="footer-fine">Prices are planning figures, not a quotation.</p>
        </div>
      </div>
    </footer>
  );
}
