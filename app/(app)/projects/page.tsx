"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlanThumb } from "@/components/estimates/plan-thumb";
import { MaterialThumb } from "@/components/estimates/material-thumb";
import { estimateType, isEstimated, statusLabel } from "@/lib/estimates-view";
import { formatDate, formatGhsOrNull } from "@/lib/format";
import { BASKET_EVENT, basketMaterialCount, readBasket, writeBasket } from "@/lib/storage/basket";
import { DRAFT_EVENT, clearDraft, draftHref, readDraft, type EstimateDraft } from "@/lib/storage/draft";
import {
  SAVED_EVENT,
  deleteSavedEstimate,
  listSavedEstimates,
  saveEstimate,
} from "@/lib/storage/saved-estimates";
import { pushDelete } from "@/lib/api/estimates";
import type { SavedEstimate } from "@/lib/types";
import { PROJECT_LABELS, totalSpaces, FITTINGS } from "@/lib/estimate-model";
import { fetchLivePrices, priceSavedEstimate } from "@/lib/estimate-live";
import type { PriceEntry } from "@/lib/quantity-engine/catalogue";

const qualityLabel = (value: string) => FITTINGS.find((entry) => entry.value === value)?.label ?? "Standard";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<SavedEstimate[]>([]);
  const [draft, setDraft] = useState<EstimateDraft | null>(null);
  const [basketCount, setBasketCount] = useState(0);
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [prices, setPrices] = useState<Record<string, PriceEntry> | null>(null);
  const [liveTotals, setLiveTotals] = useState<Record<string, number>>({});

  /**
   * A project card is a price, so it is priced the way its own estimate is priced: with the
   * current catalogue, not with whatever prices were live the day it was saved. A catalogue
   * correction therefore shows up here as well as on the estimate itself.
   */
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

  useEffect(() => {
    const syncProjects = () => setProjects(listSavedEstimates());
    const syncDraft = () => setDraft(readDraft());
    const syncBasket = () => setBasketCount(basketMaterialCount(readBasket()));

    syncProjects();
    syncDraft();
    syncBasket();
    setReady(true);

    window.addEventListener(SAVED_EVENT, syncProjects);
    window.addEventListener(DRAFT_EVENT, syncDraft);
    window.addEventListener(BASKET_EVENT, syncBasket);
    window.addEventListener("storage", syncProjects);
    window.addEventListener("storage", syncDraft);
    window.addEventListener("storage", syncBasket);

    return () => {
      window.removeEventListener(SAVED_EVENT, syncProjects);
      window.removeEventListener(DRAFT_EVENT, syncDraft);
      window.removeEventListener(BASKET_EVENT, syncBasket);
      window.removeEventListener("storage", syncProjects);
      window.removeEventListener("storage", syncDraft);
      window.removeEventListener("storage", syncBasket);
    };
  }, []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((entry) =>
      `${entry.name} ${entry.detail} ${estimateType(entry)}`.toLowerCase().includes(term),
    );
  }, [projects, query]);

  const mergeBasket = () => {
    const items = readBasket();
    if (!items.length) return;
    const units = items.reduce((sum, item) => sum + item.quantity, 0);
    const priced = items.reduce((sum, item) => (item.priceGhs == null ? sum : sum + item.priceGhs * item.quantity), 0);
    saveEstimate({
      name: "Material estimate",
      kind: "materials",
      detail: `${items.length} materials · ${units} units`,
      totalGhs: priced > 0 ? priced : null,
      items: items.map((item) => ({ name: item.name, quantity: item.quantity, unit: item.unit, priceGhs: item.priceGhs })),
    });
    writeBasket([]);
  };

  return (
    <>
      <header className="app-head">
        <div>
          <p className="app-eyebrow">Pick up where you left off</p>
          <h1 className="app-title">Saved projects</h1>
          <p className="app-sub">Saved estimates stay in this browser.</p>
        </div>
        <Link className="btn-amber" href="/quick-estimate?template=HOME-2B&fresh=1">New project</Link>
      </header>

      {draft ? (
        <section className="resume-card">
          <div>
            <span className="resume-eyebrow">Continue where you left off</span>
            <strong>{PROJECT_LABELS[draft.template] ?? "Estimate"}</strong>
            <p>
              {totalSpaces(draft.counts)} spaces · {qualityLabel(draft.quality)} fittings · updated{" "}
              {formatDate(draft.updatedAt)}
            </p>
          </div>
          <Link className="btn-amber" href={draftHref(draft)}>Continue</Link>
          <button className="link-button" type="button" onClick={clearDraft}>Dismiss</button>
        </section>
      ) : null}

      {basketCount > 0 ? (
        <section className="resume-card">
          <div>
            <span className="resume-eyebrow">In your estimate basket</span>
            <strong>{basketCount} material{basketCount === 1 ? "" : "s"} waiting</strong>
            <p>Save them as a project so the quantities are kept.</p>
          </div>
          <button className="btn-amber" type="button" onClick={mergeBasket}>Save as project</button>
        </section>
      ) : null}

      <div className="app-search">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search saved projects"
          aria-label="Search saved projects"
        />
      </div>

      {visible.length ? (
        <div className="app-grid">
          {visible.map((project) => (
            <article className="project-tile" key={project.id}>
              <Link className="project-tile-link" href={`/projects/${project.id}`}>
                {project.kind === "materials" ? <MaterialThumb /> : <PlanThumb variant={project.name.length} />}
                <div className="project-tile-body">
                  <strong>{project.name}</strong>
                  <span className="project-tile-type">{estimateType(project)}</span>
                  <span className="project-tile-meta">
                    <span className={isEstimated(project) ? "status-pill is-estimated" : "status-pill is-draft"}>
                      {statusLabel(project)}
                    </span>
                    <span>{formatGhsOrNull(liveTotals[project.id] ?? project.totalGhs) ?? "Pending"}</span>
                  </span>
                </div>
              </Link>
              <div className="project-tile-actions">
                <span className="project-tile-type">{formatDate(project.createdAt)}</span>
                <button className="link-button" type="button" onClick={() => { void pushDelete(project.id); deleteSavedEstimate(project.id); }}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="app-empty">
          {ready && projects.length
            ? "No saved projects match that search."
            : "Nothing saved yet. Build a quick estimate or a material list, save it, and it will appear here."}
        </p>
      )}
    </>
  );
}

