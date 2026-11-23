"use client";

/**
 * Console-side helpers for the estimate registry and audit log. Kept free of React so
 * the CSV export can be unit tested.
 */

export type AdminEstimate = {
  id: string;
  name: string;
  template: string;
  quality: string;
  specLevel: string;
  ruleSet: string | null;
  totalGhs: number | null;
  computedTotalGhs: number;
  lines: number;
  pricedLines: number;
  pendingLines: number;
  spaces: number;
  specialLoads: number;
  owner: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminAuditEntry = {
  id: string;
  actor_key: string;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: string | null;
  created_at: string;
};

export const money = (value: number | null | undefined): string =>
  value === null || value === undefined
    ? "—"
    : `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const shortDate = (iso: string): string => {
  const date = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

const escapeCell = (value: string): string => {
  const safe = value.replace(/"/g, '""');
  return /[",\n]/.test(safe) ? `"${safe}"` : safe;
};

/** One row per estimate, with the columns a support person actually needs. */
export function estimatesToCsv(rows: AdminEstimate[]): string {
  const header = [
    "Created",
    "Name",
    "Template",
    "Specification",
    "Rule set",
    "Spaces",
    "Lines",
    "Priced",
    "Pending",
    "Special loads",
    "Total GHS",
    "Status",
    "Owner",
  ];
  const lines = rows.map((row) =>
    [
      shortDate(row.createdAt),
      row.name,
      row.template,
      row.specLevel,
      row.ruleSet ?? "",
      String(row.spaces),
      String(row.lines),
      String(row.pricedLines),
      String(row.pendingLines),
      String(row.specialLoads),
      row.totalGhs === null ? "" : row.totalGhs.toFixed(2),
      row.status,
      row.owner,
    ]
      .map(escapeCell)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
