import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkEnabled, env } from "@/lib/env";
import "../styles/fonts.css";
import "../styles/globals.css";
import "../styles/home.css";
import "../styles/pages.css";
import "../styles/auth.css";
import "../styles/shell.css";
import "../styles/brand.css";
import "../styles/footer.css";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SessionGuard } from "@/components/auth/session-guard";

export const metadata: Metadata = {
  title: "ESTIMO - Estimate Smarter. Build Better.",
  description: "Ghana-focused electrical estimating and material intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const shell = (
    <div className="shell">
      <SiteHeader />
      {children}
      <SiteFooter year={new Date().getFullYear()} />
    </div>
  );

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
        {clerkEnabled ? (
          <ClerkProvider publishableKey={env.clerkPublishableKey}>
            <SessionGuard />
            {shell}
          </ClerkProvider>
        ) : (
          shell
        )}
      </body>
    </html>
  );
}
