import type { SavedEstimate } from "@/lib/types";

/** "2-Bedroom Home · Standard fittings" -> "2-Bedroom Home" */
export function estimateType(entry: SavedEstimate): string {
  const first = entry.detail.split(" · ")[0]?.trim();
  if (first) return first;
  return entry.kind === "materials" ? "Material list" : "Estimate";
}

export function isEstimated(entry: SavedEstimate): boolean {
  return entry.totalGhs != null;
}

export function statusLabel(entry: SavedEstimate): string {
  return isEstimated(entry) ? "Estimated" : "Draft";
}
