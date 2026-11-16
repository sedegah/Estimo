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
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "ESTIMO â€” Estimate Smarter. Build Better.",
  description: "Ghana-focused electrical estimating and material intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const shell = (
    <div className="shell">
      <SiteHeader />
      {children}
    </div>
  );

  return (
    <html lang="en">
      <body>
        {clerkEnabled ? <ClerkProvider publishableKey={env.clerkPublishableKey}>{shell}</ClerkProvider> : shell}
      </body>
    </html>
  );
}

