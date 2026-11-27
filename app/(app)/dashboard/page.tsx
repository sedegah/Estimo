"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlanThumb } from "@/components/estimates/plan-thumb";
import { MaterialThumb } from "@/components/estimates/material-thumb";
import { computeEstimate, defaultCounts, estimateLines, projectType, totalSpaces } from "@/lib/estimate-model";
import { estimateType, isEstimated, statusLabel } from "@/lib/estimates-view";
import { formatDate, formatGhs, formatGhsOrNull } from "@/lib/format";
import { DRAFT_EVENT, readDraft, type EstimateDraft } from "@/lib/storage/draft";
import { SAVED_EVENT, listSavedEstimates } from "@/lib/storage/saved-estimates";
import type { SavedEstimate } from "@/lib/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<SavedEstimate[]>([]);
  const [draft, setDraft] = useState<EstimateDraft | null>(null);

  useEffect(() => {
    const syncProjects = () => setProjects(listSavedEstimates());
    const syncDraft = () => setDraft(readDraft());

    syncProjects();
    syncDraft();

    window.addEventListener(SAVED_EVENT, syncProjects);
    window.addEventListener(DRAFT_EVENT, syncDraft);
    window.addEventListener("storage", syncProjects);
    window.addEventListener("storage", syncDraft);

    return () => {
      window.removeEventListener(SAVED_EVENT, syncProjects);
      window.removeEventListener(DRAFT_EVENT, syncDraft);
      window.removeEventListener("storage", syncProjects);
      window.removeEventListener("storage", syncDraft);
    };
  }, []);

  const draftTotal = draft ? computeEstimate(draft.template, draft.counts, draft.quality) : 0;
  const draftLines = draft ? estimateLines(draftTotal, draft.template, draft.counts) : [];
  const recent = projects.slice(0, 3);

  return (
    <>
      <header className="app-head">
        <div>
          <p className="app-eyebrow">Welcome back</p>
          <h1 className="app-title">Your projects</h1>
          <p className="app-sub">
            {projects.length
              ? `${projects.length} saved estimate${projects.length === 1 ? "" : "s"} in this browser.`
              : "Start an estimate and it will show up here."}
          </p>
        </div>
        <Link className="btn-amber" href="/quick-estimate?template=HOME-2B&fresh=1">New estimate</Link>
      </header>

      {recent.length ? (
        <div className="app-grid">
          {recent.map((project) => (
            <Link className="project-tile" href={`/projects/${project.id}`} key={project.id}>
              {project.kind === "materials" ? <MaterialThumb /> : <PlanThumb variant={project.name.length} />}
              <span className="project-tile-body">
                <strong>{project.name}</strong>
                <span className="project-tile-type">{estimateType(project)}</span>
                <span className="project-tile-meta">
                  <span className={isEstimated(project) ? "status-pill is-estimated" : "status-pill is-draft"}>
                    {statusLabel(project)}
                  </span>
                  <span>{formatGhsOrNull(project.totalGhs) ?? "Pending"}</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="app-empty">No saved estimates yet. Start an estimate and save it to see it here.</p>
      )}

      <div className="app-cols">
        <section className="panel">
          <h2 className="panel-title">Current estimate</h2>
          {draft ? (
            <>
              <div className="table-card" style={{ border: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th className="align-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftLines.map((line) => (
                      <tr key={line.label}>
                        <td>{line.label}</td>
                        <td className="muted-cell">{line.quantity}</td>
                        <td className="align-right">{formatGhs(line.amount, 0)}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>First estimate</td>
                      <td />
                      <td className="align-right">{formatGhs(draftTotal, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="settings-note">
                {projectType(draft.template).label} · {totalSpaces(draft.counts)} spaces · updated{" "}
                {formatDate(draft.updatedAt)} ·{" "}
                <Link className="link-button" href={`/quick-estimate?template=${draft.template}`}>
                  Continue
                </Link>
              </p>
            </>
          ) : projects.length ? (
            <>
              <p className="settings-note">
                No estimate open right now, but your latest is <strong>{projects[0].name}</strong>
                {projects[0].totalGhs != null ? ` · ${formatGhs(projects[0].totalGhs, 0)}` : ""} · saved{" "}
                {formatDate(projects[0].updatedAt ?? projects[0].createdAt)}.
              </p>
              <p className="settings-note">
                <Link className="link-button" href={`/projects/${projects[0].id}`}>
                  Open latest estimate
                </Link>{" "}
                ·{" "}
                <Link className="link-button" href="/quick-estimate?template=HOME-2B&fresh=1">
                  Start a new one
                </Link>
              </p>
            </>
          ) : (
            <p className="settings-note">
              No estimate in progress. <Link className="link-button" href="/quick-estimate?template=HOME-2B&fresh=1">Start one</Link>
            </p>
          )}
        </section>

        <aside className="panel">
          <span className="panel-eyebrow">Plan key</span>
          <div className="plan-key">
            <div className="plan-key-row"><span className="plan-symbol plan-symbol-light" aria-hidden="true" />Light point</div>
            <div className="plan-key-row"><span className="plan-symbol plan-symbol-socket" aria-hidden="true" />Socket</div>
            <div className="plan-key-row"><span className="plan-symbol plan-symbol-db" aria-hidden="true">DB</span>Distribution board</div>
            <div className="plan-key-row"><span className="plan-symbol plan-symbol-run" aria-hidden="true" />Circuit run</div>
          </div>
        </aside>
      </div>
    </>
  );
}
