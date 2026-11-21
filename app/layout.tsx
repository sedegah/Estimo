import type { Metadata } from "next";
import { clerkEnabled } from "@/lib/env";
import { hasSessionCookie } from "@/lib/auth-cookie";
import "../styles/fonts.css";
import "../styles/globals.css";
import "../styles/home.css";
import "../styles/pages.css";
import "../styles/auth.css";
import "../styles/shell.css";
import "../styles/brand.css";
import "../styles/footer.css";
import "../styles/legal.css";
import "../styles/cookie-notice.css";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieNotice } from "@/components/layout/cookie-notice";
import { ClerkBoundary } from "@/components/layout/clerk-boundary";

export const metadata: Metadata = {
  title: "ESTIMO - Estimate Smarter. Build Better.",
  description: "Ghana-focused electrical estimating and material intelligence.",
};

/**
 * Clerk is mounted by the layouts that need it (the app shell and the auth pages).
 * Public pages only read the session cookie, so visitors who are not signed in do
 * not download Clerk's runtime at all.
 */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const signedIn = clerkEnabled && (await hasSessionCookie());

  return (
    <html lang="en">
      <body>
        <link
          rel="preload"
          href="/fonts/bricolage-grotesque-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/bricolage-grotesque-latin-ext.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <ClerkBoundary enabled={signedIn}>
        <div className="shell">
          <SiteHeader signedIn={signedIn} />
          {children}
          <SiteFooter year={new Date().getFullYear()} />
          <CookieNotice />
        </div>
      </ClerkBoundary>
      </body>
    </html>
  );
}