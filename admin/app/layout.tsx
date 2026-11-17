import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { RouteLoading } from "./route-loading";
import "../styles/fonts.css";
import "../styles/admin.css";

export const metadata: Metadata = { title: "ESTIMO Admin" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "pk_test_YmVsb3ZlZC1nb3BoZXItNjYzMS5jbGVyay5hY2NvdW50cy5kZXYk"}>
          <RouteLoading />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
