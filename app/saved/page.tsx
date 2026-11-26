"use client";

/**
 * Saved estimates for everyone — no account needed.
 *
 * A visitor who is not signed in saves into this browser. This page is the way back:
 * it lists what is here, prices each estimate at today's catalogue, opens one on its
 * itemized bill (rebuilding the plan from the saved counters when the older save did not
 * keep a full take-off), and can find an estimate by the code printed on its card.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PlanThumb } from "@/components/estimates/plan-thumb";
import { MaterialThumb } from "@/components/estimates/material-thumb";
import { estimateType, isEstimated, statusLabel } from "@/lib/estimates-view";
import { formatDate, formatGhsOrNull } from "@/lib/format";
import {
  defaultPlanAdditions,
  fetchLivePrices,
  priceSavedEstimate,
  PROJECT_TYPE_FOR_CODE,
  spacesFromCounts,
  specLevelForQuality,
  TEMPLATE_FOR_CODE,
} from "@/lib/estimate-live";
import {
  SAVED_EVENT,
  deleteSavedEstimate,
  listSavedEstimates,
  purgeExpiredEstimates,
  RETENTION_DAYS,
  touchSavedEstimate,
} from "@/lib/storage/saved-estimates";
import { pushDelete } from "@/lib/api/estimates";
import { FITTINGS } from "@/lib/estimate-model";
import type { PriceEntry } from "@/lib/quantity-engine/catalogue";
import type { PointOverride, SpaceInput, SpecLevel } from "@/lib/quantity-engine/types";
import type { SavedEstimate } from "@/lib/types";

const qualityLabel = (value: string | undefined) =>
  FITTINGS.find((entry) => entry.value === value)?.label ?? "Standard";

export default function SavedEstimatesPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<SavedEstimate[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceEntry> | null>(null);
  const [liveTotals, setLiveTotals] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [lookup, setLookup] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      // estimates nobody has opened for RETENTION_DAYS go, server copies included
      for (const id of purgeExpiredEstimates()) void pushDelete(id);
      setProjects(listSavedEstimates());
      setReady(true);
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

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((project) =>
      `${project.name} ${project.detail} ${project.code ?? ""} ${estimateType(project)}`
        .toLowerCase()
        .includes(term),
    );
  }, [projects, query]);

  /**
   * Reopens an estimate on the itemized bill. Newer saves carry a full take-off; a save
   * made from the summary keeps only the counters, so the plan is rebuilt from them —
   * the same builder the summary itself uses, so the bill matches what was saved.
   */
  const open = (project: SavedEstimate) => {
    touchSavedEstimate(project.id);
    const code = project.template ?? "HOME-2B";
    const quantities = project.quantities;
    const templateId = quantities?.templateId ?? TEMPLATE_FOR_CODE[code] ?? "T011";
    const specLevel = (quantities?.specLevel ??
      specLevelForQuality(project.quality ?? "standard")) as SpecLevel;
    const spaces = (quantities?.spaces?.length
      ? quantities.spaces
      : spacesFromCounts(templateId, (project.counts ?? {}) as Record<string, number>)) as SpaceInput[];
    const defaults = defaultPlanAdditions({
      projectType: PROJECT_TYPE_FOR_CODE[code] ?? "two_bedroom",
      templateId,
      spaces,
    });
    try {
      localStorage.setItem(
        "estimo_estimate_draft_v1",
        JSON.stringify({
          template: code,
          projectType: PROJECT_TYPE_FOR_CODE[code] ?? "two_bedroom",
          templateId,
          specLevel,
          spaces,
          overrides:
            quantities?.specialLoadInstances?.length
              ? ((quantities.overrides ?? []) as PointOverride[])
              : defaults.overrides,
          specialLoadInstances: quantities?.specialLoadInstances?.length
            ? quantities.specialLoadInstances
            : defaults.instances,
        }),
      );
    } catch {}
    const quality =
      specLevel === "economy" ? "basic" : specLevel === "premium" ? "premium" : "standard";
    router.push(
      `/itemized?template=${encodeURIComponent(code)}&id=${encodeURIComponent(templateId)}&quality=${quality}`,
    );
  };

  const remove = (project: SavedEstimate) => {
    void pushDelete(project.id);
    deleteSavedEstimate(project.id);
  };

  /** Pull an estimate by the code written on its card. */
  const openByCode = () => {
    const wanted = lookup.trim().toUpperCase();
    if (!wanted) return;
    const match = projects.find((project) => (project.code ?? "").toUpperCase() === wanted);
    if (!match) {
      setLookupError(`No estimate coded ${wanted} is saved on this device.`);
      return;
    }
    setLookupError("");
    open(match);
  };

  return (
    <main className="container page-shell">
      <header className="app-head">
        <div>
          <p className="app-eyebrow">Saved on this device</p>
          <h1 className="app-title">Saved estimates</h1>
          <p className="app-sub">
            {ready && projects.length
              ? `${projects.length} estimate${projects.length === 1 ? "" : "s"} in this browser · priced at today’s catalogue · cleared after ${RETENTION_DAYS} days without being opened.`
              : `No account needed. They stay in this browser, priced at today’s catalogue, and clear after ${RETENTION_DAYS} days without being opened.`}
          </p>
        </div>
        <Link className="btn-amber" href="/quick-estimate?template=HOME-2B&fresh=1">
          New estimate
        </Link>
      </header>

      <section className="saved-toolbar">
        <form
          className="saved-lookup"
          onSubmit={(event) => {
            event.preventDefault();
            openByCode();
          }}
        >
          <label className="saved-lookup-label" htmlFor="estimate-code">
            Open by code
          </label>
          <div className="saved-lookup-row">
            <input
              id="estimate-code"
              type="text"
              value={lookup}
              onChange={(event) => {
                setLookup(event.target.value);
                setLookupError("");
              }}
              placeholder="EST-7K3M9Q"
              autoComplete="off"
              spellCheck={false}
            />
            <button className="btn-outline" type="submit">
              Open
            </button>
          </div>
          {lookupError ? <p className="saved-lookup-error">{lookupError}</p> : null}
        </form>

        <div className="saved-find">
          <label className="saved-lookup-label" htmlFor="saved-search">
            Find
          </label>
          <input
            id="saved-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, type or code"
            aria-label="Search saved estimates"
          />
          <p className="saved-lookup-hint">The code is printed on each card, so it can be read out and typed back.</p>
        </div>
      </section>

      {visible.length ? (
        <div className="app-grid">
          {visible.map((project) => (
            <article className="project-tile" key={project.id}>
              <button
                type="button"
                className="project-tile-open"
                onClick={() => open(project)}
                aria-label={`Open ${project.name}`}
              >
                {project.kind === "materials" ? <MaterialThumb /> : <PlanThumb variant={project.name.length} />}
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
              </button>
              <div className="project-tile-actions">
                {formatDate(project.lastAccessedAt ?? project.updatedAt ?? project.createdAt)}
                {project.quality ? ` · ${qualityLabel(project.quality)}` : ""}
              </div>
              <div className="saved-card-buttons">
                <button className="btn-outline saved-card-open" type="button" onClick={() => open(project)}>
                  Open
                </button>
                <button className="link-button" type="button" onClick={() => remove(project)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="saved-empty">
          <h2 className="saved-empty-title">
            {ready && projects.length ? "No estimate matches that search" : "Nothing saved yet"}
          </h2>
          <p className="saved-empty-text">
            {ready && projects.length
              ? "Try the code, the project name, or clear the search."
              : "Start an estimate and save it — signed in or not, it will appear here with a code you can come back to."}
          </p>
          {ready && !projects.length ? (
            <Link className="btn-amber" href="/quick-estimate?template=HOME-2B&fresh=1">
              Start an estimate
            </Link>
          ) : null}
        </section>
      )}
    </main>
  );
}
