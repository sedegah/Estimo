"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/prices", "Prices"],
  ["/materials", "Materials"],
  ["/settings", "Settings"],
] as const;

export function RailNav() {
  const pathname = usePathname();
  return (
    <>
      {links.map(([href, label]) => (
        <Link key={href} className={pathname === href ? "admin-rail-link is-active" : "admin-rail-link"} href={href}>
          {label}
        </Link>
      ))}
    </>
  );
}
