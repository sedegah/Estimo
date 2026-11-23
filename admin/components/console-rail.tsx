"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";

const MANAGE = [
  { label: "Prices", href: "/" },
  { label: "Materials", href: "/?tab=materials" },
  { label: "Add material", href: "/materials/new" },
  { label: "Estimate builder", href: "/builder" },
  { label: "Quantities", href: "/quantities" },
  { label: "Settings", href: "/?tab=settings" },
];

/**
 * One console navigation for every screen. The dashboard's tabbed pages are reached
 * with ?tab=, the rest are their own routes; the entry matching the current location
 * is marked, and the account block shows who is signed in rather than a stray link.
 */
export function ConsoleRail({ active }: { active?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const tab = params.get("tab");
  const current =
    active ??
    (pathname === "/"
      ? tab === "materials"
        ? "Materials"
        : tab === "settings"
          ? "Settings"
          : "Prices"
      : MANAGE.find((link) => link.href === pathname)?.label);

  return (
    <aside className="rail">
      <p className="rail-label">Manage</p>

      {MANAGE.map((link) => (
        <Link key={link.label} className={current === link.label ? "rail-item is-active" : "rail-item"} href={link.href}>
          {link.label}
        </Link>
      ))}

      <div className="rail-account">
        {!isLoaded ? null : isSignedIn ? (
          <>
            <p className="rail-who">{user?.primaryEmailAddress?.emailAddress ?? "Signed in"}</p>
            <button className="rail-item" type="button" onClick={() => void signOut({ redirectUrl: "/" })}>
              Sign out
            </button>
          </>
        ) : (
          <Link className="rail-item" href="/signin">Sign in</Link>
        )}
        <p className="rail-build">Console build {process.env.NEXT_PUBLIC_CONSOLE_BUILD ?? "dev"}</p>
      </div>
    </aside>
  );
}
