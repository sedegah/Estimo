"use client";

/**
 * Saved estimates for everyone.
 *
 * Someone who is not signed in still saves estimates — they live in this browser. This page
 * is the way back to them: no account, no sign-in, just the local store, priced at today's
 * catalogue the same way the project page prices them.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { estimateType, isEstimated, statusLabel } from "@/lib/estimates-view";
import { formatDate, formatGhsOrNull } from "@/lib/format";
import { fetchLivePrices, priceSavedEstimate, TEMPLATE_FOR_CODE } from "@/lib/estimate-live";
import {
  SAVED_EVENT,
  deleteSavedEstimate,
  listSavedEstimates,
  purgeExpiredEstimates,
  touchSavedEstimate,
} from "@/lib/storage/saved-estimates";
import { pushDelete } from "@/lib/api/estimates";
import type { PriceEntry } from "@/lib/quantity-engine/catalogue";
import type { SavedEstimate } from "@/lib/types";

export default function SavedEstimatesPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<SavedEstimate[]>([]);
  const [codeQuery, setCodeQuery] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [prices, setPrices] = useState<Record<string, PriceEntry> | null>(null);
  const [liveTotals, setLiveTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    const sync = () => {
      // estimates nobody has opened in 40 days go, and their server copies with them
      for (const id of purgeExpiredEstimates()) void pushDelete(id);
      setProjects(listSavedEstimates());
    };
    sync();
    window.addEventListener(SAVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SAVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchLivePrices().then((next) => {
      if (!cancelled) setPrices(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!prices) return;
    const next: Record<string, number> = {};
    for (const project of projects) {
      const total = priceSavedEstimate(project, prices);
      if (total !== null) next[project.id] = total;
    }
    setLiveTotals(next);
  }, [projects, prices]);

  /** Reopens an estimate on the itemized bill, plan and all, without saving first. */
  const open = (project: SavedEstimate) => {
    touchSavedEstimate(project.id);
    const quantities = project.quantities;
    const code = project.template ?? "HOME-2B";
    const templateId = quantities?.templateId ?? TEMPLATE_FOR_CODE[code] ?? "T011";
    if (quantities?.spaces?.length) {
      try {
        localStorage.setItem(
          "estimo_estimate_draft_v1",
          JSON.stringify({
            template: code,
            templateId,
            specLevel: quantities.specLevel ?? "standard",
            spaces: quantities.spaces,
            overrides: quantities.overrides ?? [],
            specialLoadInstances: quantities.specialLoadInstances ?? [],
          }),
        );
      } catch {}
    }
    router.push(`/itemized?template=${encodeURIComponent(code)}&id=${encodeURIComponent(templateId)}`);
  };

  /** Pull an estimate by the code written on its card. */
  const lookup = () => {
    const wanted = codeQuery.trim().toUpperCase();
    if (!wanted) return;
    const match = projects.find((project) => (project.code ?? "").toUpperCase() === wanted);
    if (!match) {
      setLookupError(`No estimate coded ${wanted} is saved on this device.`);
      return;
    }
    setLookupError("");
    open(match);
  };

  const remove = (project: SavedEstimate) => {
    void pushDelete(project.id);
    deleteSavedEstimate(project.id);
  };

  return (
    <>
      <header className="app-head">
        <div>
          <p className="app-eyebrow">Saved on this device</p>
          <h1 className="app-title">Saved estimates</h1>
          <p className="app-sub">
            They stay in this browser until you delete them. Prices follow today&apos;s catalogue.
          </p>
        </div>
        <Link className="btn-amber" href="/quick-estimate?template=HOME-2B&fresh=1">
          New estimate
        </Link>
      </header>

      <form
        className="app-search"
        onSubmit={(event) => {
          event.preventDefault();
          lookup();
        }}
      >
        <input
          type="search"
          value={codeQuery}
          onChange={(event) => {
            setCodeQuery(event.target.value);
            setLookupError("");
          }}
          placeholder="Open by code, e.g. EST-7K3M9Q"
          aria-label="Open an estimate by its code"
        />
        <button className="btn-outline" type="submit">Open</button>
      </form>
      {lookupError ? <p className="app-empty">{lookupError}</p> : null}

      {projects.length ? (
        <div className="app-grid">
          {projects.map((project) => (
            <article className="project-tile" key={project.id}>
              <div className="project-tile-body">
                <strong>{project.name}</strong>
                <span className="project-tile-type">
                  {estimateType(project)}
                  {project.code ? <span className="project-tile-code">{project.code}</span> : null}
                </span>
                <span className="project-tile-meta">
                  <span className={isEstimated(project) ? "status-pill is-estimated" : "status-pill is-draft"}>
                    {statusLabel(project)}
                  </span>
                  <span>{formatGhsOrNull(liveTotals[project.id] ?? project.totalGhs) ?? "Pending"}</span>
                </span>
              </div>
              <div className="project-tile-actions">
                <span className="project-tile-type">{formatDate(project.updatedAt ?? project.createdAt)}</span>
                <div className="project-tile-buttons">
                  {project.quantities?.spaces?.length ? (
                    <button className="link-button" type="button" onClick={() => open(project)}>
                      Open estimate
                    </button>
                  ) : null}
                  <button className="link-button" type="button" onClick={() => remove(project)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="app-empty">
          Nothing saved yet. Save an estimate and it will appear here, signed in or not.
        </p>
      )}
    </>
  );
}
