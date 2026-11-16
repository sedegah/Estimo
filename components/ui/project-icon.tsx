import type { ReactNode } from "react";

export type ProjectIconCode =
  | "SHOP-KIOSK"
  | "HOME-1R"
  | "HOME-1B"
  | "HOME-2B"
  | "HOME-3B"
  | "HOME-4B"
  | "COMM-OFF-S"
  | "SHOP-RETAIL"
  | "IND-WORK";

const icons: Record<ProjectIconCode, ReactNode> = {
  "HOME-1R": (
    <>
      <path d="M4 10.4 12 4l8 6.4V20H4z" />
      <path d="M10 20v-4.5h4V20" />
    </>
  ),
  "HOME-1B": (
    <>
      <path d="M4 10.4 12 4l8 6.4V20H4z" />
      <path d="M9 13.5h2M13 13.5h2" />
    </>
  ),
  "HOME-2B": (
    <>
      <path d="M4 10.4 12 4l8 6.4V20H4z" />
      <path d="M8 13.5h3M13 13.5h3" />
      <path d="M9 17.5h6" />
    </>
  ),
  "HOME-3B": (
    <>
      <path d="M4 10.4 12 4l8 6.4V20H4z" />
      <path d="M8 12.5h3M13 12.5h3M8 16.5h3M13 16.5h3" />
    </>
  ),
  "HOME-4B": (
    <>
      <path d="M3 11 12 4l9 7v9H3z" />
      <path d="M8 12.5h3M13 12.5h3M8 16.5h3M13 16.5h3" />
    </>
  ),
  "SHOP-KIOSK": (
    <>
      <rect x="3" y="8" width="18" height="9" rx="1.6" />
      <path d="M8.5 8v9M15.5 8v9" />
      <path d="M6 20h1.5M16.5 20H18" />
    </>
  ),
  "SHOP-RETAIL": (
    <>
      <path d="M4 9.2h16l-1.4 3.6H5.4z" />
      <path d="M5.4 12.8V20h13.2v-7.2" />
      <path d="M10 20v-4h4v4" />
    </>
  ),
  "COMM-OFF-S": (
    <>
      <rect x="5" y="3.5" width="14" height="16.5" rx="1.6" />
      <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" />
    </>
  ),
  "IND-WORK": (
    <>
      <path d="M3 20V10.5l5 3v-3l5 3 6-3V20z" />
      <path d="M17 3.5h3v6.4" />
    </>
  ),
};

export function ProjectIcon({ code, className }: { code: ProjectIconCode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {icons[code]}
    </svg>
  );
}
