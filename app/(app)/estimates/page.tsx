"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { estimateType, isEstimated, statusLabel } from "@/lib/estimates-view";
import { formatDate, formatGhsOrNull } from "@/lib/format";
import {
  SAVED_EVENT,
  deleteSavedEstimate,
  listSavedEstimates,
} from "@/lib/storage/saved-estimates";
import { pushDelete } from "@/lib/api/estimates";
import type { SavedEstimate } from "@/lib/types";

type Filter = "all" | "estimated" | "draft";

export default function EstimatesPage() {
  const [projects, setProjects] = useState<SavedEstimate[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const sync = () => setProjects(listSavedEstimates());
    sync();
    window.addEventListener(SAVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SAVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const rows = useMemo(() => {
    if (filter === "estimated") return projects.filter((entry) => isEstimated(entry));
    if (filter === "draft") return projects.filter((entry) => !isEstimated(entry));
    return projects;
  }, [projects, filter]);

  return (
    <>
      <header className="app-head">
        <div>
          <p className="app-eyebrow">Every estimate in one place</p>
          <h1 className="app-title">Estimates</h1>
        </div>
        <Link className="btn-amber" href="/quick-estimate?template=HOME-2B">New estimate</Link>
      </header>

      <div className="chip-row">
        <button className={filter === "all" ? "chip is-active" : "chip"} type="button" onClick={() => setFilter("all")}>All</button>
        <button className={filter === "draft" ? "chip is-active" : "chip"} type="button" onClick={() => setFilter("draft")}>Draft</button>
        <button className={filter === "estimated" ? "chip is-active" : "chip"} type="button" onClick={() => setFilter("estimated")}>Estimated</button>
      </div>

      {rows.length ? (
        <section className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Type</th>
                <th>Status</th>
                <th>Updated</th>
                <th className="align-right">Total</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.id}>
                  <td className="saved-name">{entry.name}</td>
                  <td className="muted-cell">{estimateType(entry)}</td>
                  <td>
                    <span className={isEstimated(entry) ? "status-pill is-estimated" : "status-pill is-draft"}>
                      {statusLabel(entry)}
                    </span>
                  </td>
                  <td className="muted-cell">{formatDate(entry.createdAt)}</td>
                  <td className="align-right">{formatGhsOrNull(entry.totalGhs) ?? "Pending"}</td>
                  <td className="table-action">
                    <button className="link-button" type="button" onClick={() => { void pushDelete(entry.id); deleteSavedEstimate(entry.id); }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <p className="app-empty">No estimates in this view yet.</p>
      )}
    </>
  );
}
