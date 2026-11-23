"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Prices" },
  { href: "/materials/new", label: "Add material" },
  { href: "/builder", label: "Estimate builder" },
  { href: "/quantities", label: "Quantities" },
  { href: "/estimates", label: "Estimates" },
  { href: "/rules", label: "Rules" },
  { href: "/audit", label: "Audit log" },
  { href: "/", label: "Settings" },
];

/** Console navigation shared by the newer admin screens. */
export function ConsoleRail({ active }: { active: string }) {
  const pathname = usePathname();
  return (
    <aside className="rail">
      <p className="rail-brand">ESTIMO</p>
      <p className="rail-label">Manage</p>
      {LINKS.filter((link) => link.label !== "Settings").map((link) => (
        <Link
          key={link.label}
          className={link.href === pathname && link.label === active ? "rail-item is-active" : "rail-item"}
          href={link.href}
        >
          {link.label}
        </Link>
      ))}
      <p className="rail-label" style={{ marginTop: 18 }}>Account</p>
      <a className="rail-item" href="/signin">Sign in</a>
    </aside>
  );
}
