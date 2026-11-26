"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  FITTINGS,
  PROJECT_LABELS,
  clampCount,
  defaultCounts,
  minimumCount,
  projectType,
  totalSpaces,
  type Counts,
  type FittingQuality,
  type SpaceItem,
} from "@/lib/estimate-model";
import { formatGhs } from "@/lib/format";
import {
  defaultPlanAdditions,
  fetchLivePrices,
  liveEstimate,
  PROJECT_TYPE_FOR_CODE,
  qualityForSpecLevel,
  spacesFromCounts,
  specLevelForQuality,
  TEMPLATE_FOR_CODE,
  templateForCode,
} from "@/lib/estimate-live";
import { parseSpecialLoadInstances, type SpecialLoadInstance } from "@/lib/quantity-engine/special-loads";
import type { SpecLevel } from "@/lib/quantity-engine/types";
import type { PointOverride, SpaceInput } from "@/lib/quantity-engine/types";
import { saveEstimate } from "@/lib/storage/saved-estimates";
import { saveDraft } from "@/lib/storage/draft";
import { pushCreate } from "@/lib/api/estimates";

/** The estimate prints cedis as "GHS" with pesewas, matching the itemized bill exactly. */
const money = (value: number) =>
  `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const itemQuantity = (item: SpaceItem) =>
  item.lights ?? item.sockets ?? item.acs ?? item.heaters ?? item.switches ?? item.cooking ?? 0;

function ProjectTypeSelect({ template, onChange }: { template: string; onChange: (value: string) => void }) {
  return (
    <div className="setup-project">
      <label htmlFor="project-type">Project type</label>
      <select id="project-type" value={template} onChange={(event) => onChange(event.target.value)}>
        {Object.entries(PROJECT_LABELS).map(([code, name]) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
    </div>
  );
}

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = searchParams.get("template") || "HOME-2B";
  const type = projectType(template);

  const initialCounts = (): Counts => {
    const defaults = defaultCounts(type.code);
    const next: Counts = { ...defaults };
    for (const field of type.fields) {
      const raw = searchParams.get(field.key);
      if (raw !== null && raw !== "") next[field.key] = clampCount(type.code, field.key, Number(raw));
    }
    return next;
  };

  const [counts, setCounts] = useState<Counts>(initialCounts);
  /**
   * The specification is the one figure the itemized bill and this screen share: "Standard"
   * here is `standard` there. It is state, not derived from a label, so the itemized bill's
   * choice can be adopted on the way back without the two disagreeing.
   */
  const [specLevel, setSpecLevel] = useState<SpecLevel>(() =>
    specLevelForQuality((searchParams.get("quality") as FittingQuality) || "standard"),
  );
  const quality = qualityForSpecLevel(specLevel);
  const [openSpaces, setOpenSpaces] = useState<string[]>(() =>
    (searchParams.get("open") ?? "").split(",").filter(Boolean),
  );
  const [saved, setSaved] = useState(false);
  const lastTemplate = useRef(type.code);

  useEffect(() => {
    if (lastTemplate.current === type.code) return;
    lastTemplate.current = type.code;
    setCounts(defaultCounts(type.code));
    setSaved(false);
  }, [type.code]);

  // Keep a resumable draft of the current setup.
  useEffect(() => {
    saveDraft({ template: type.code, counts, quality });
  }, [type.code, counts, quality]);

  const templateId = TEMPLATE_FOR_CODE[type.code] ?? "T011";

  /**
   * The itemized bill is the source of truth for price. It publishes its priced lines and
   * total into the shared draft; this screen reads that bill and prints it, so the summary
   * and the itemized page can never quote different money for one estimate.
   */
  const [carried, setCarried] = useState<{
    spaces: SpaceInput[];
    overrides: PointOverride[];
    instances: SpecialLoadInstance[];
    bill: { totalGhs: number; lines: { name: string; quantity: number; unit: string; priceGhs: number | null }[] } | null;
  } | null>(null);

  /**
   * "Start estimate" asks for a new estimate, so it must not reopen the last draft. The
   * request is honoured once: the stored take-off is discarded and the flag is dropped from
   * the URL, so coming back from the itemized bill still restores the plan made here.
   */
  const freshRef = useRef(searchParams.get("fresh") !== null);

  useEffect(() => {
    /**
     * Reads the take-off and bill the itemized page left behind. It is re-read whenever
     * the page becomes visible again, so an edit there is always reflected here.
     */
    const read = () => {
      if (freshRef.current) {
        // a new estimate: forget the draft and the counters it came from, once
        freshRef.current = false;
        try {
          localStorage.removeItem("estimo_estimate_draft_v1");
          localStorage.removeItem("estimo_draft_v1");
        } catch {}
        setCarried(null);
        router.replace(`/quick-estimate?template=${encodeURIComponent(type.code)}`);
        return;
      }
      try {
        const raw = localStorage.getItem("estimo_estimate_draft_v1");
        if (!raw) {
          setCarried(null);
          return;
        }
        const draft = JSON.parse(raw) as {
          templateId?: string;
          specLevel?: string;
          spaces?: SpaceInput[];
          overrides?: PointOverride[];
          specialLoadInstances?: unknown[];
          bill?: { totalGhs?: number; lines?: unknown[] };
        };
        if (draft.templateId !== templateId || !draft.spaces?.length) {
          setCarried(null);
          return;
        }
        // the specification chosen in the itemized bill comes back with it
        if (
          draft.specLevel === "economy" ||
          draft.specLevel === "premium" ||
          draft.specLevel === "standard"
        ) {
          setSpecLevel(draft.specLevel);
        }
        const bill =
          draft.bill &&
          typeof draft.bill.totalGhs === "number" &&
          Number.isFinite(draft.bill.totalGhs) &&
          Array.isArray(draft.bill.lines) &&
          draft.bill.lines.length
            ? {
                totalGhs: draft.bill.totalGhs,
                lines: (draft.bill.lines as Record<string, unknown>[])
                  .filter((line) => typeof line.name === "string")
                  .map((line) => ({
                    name: String(line.name),
                    quantity: Math.max(1, Math.round(Number(line.quantity) || 1)),
                    unit: typeof line.unit === "string" ? line.unit : "No.",
                    priceGhs: typeof line.priceGhs === "number" ? line.priceGhs : null,
                  })),
              }
            : null;
        setCarried({
          spaces: draft.spaces,
          overrides: draft.overrides ?? [],
          instances: parseSpecialLoadInstances(draft.specialLoadInstances),
          bill,
        });
      } catch {
        setCarried(null);
      }
    };

    read();
    const onVisible = () => {
      if (document.visibilityState === "visible") read();
    };
    window.addEventListener("focus", read);
    window.addEventListener("popstate", read);
    window.addEventListener("pageshow", read);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", read);
      window.removeEventListener("popstate", read);
      window.removeEventListener("pageshow", read);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [templateId]);

  const planSpaces = useMemo(
    () => carried?.spaces ?? spacesFromCounts(templateId, counts),
    [carried, templateId, counts],
  );

  /**
   * What the plan starts with: the rulebook's default loads (the kitchen fridge) and, for a
   * home, an air conditioner per bedroom and living area. The itemized bill seeds the same
   * way, so a home is air conditioned on both screens.
   */
  const defaults = useMemo(
    () =>
      defaultPlanAdditions({
        projectType: PROJECT_TYPE_FOR_CODE[type.code] ?? "two_bedroom",
        templateId,
        spaces: planSpaces,
      }),
    [type.code, templateId, planSpaces],
  );
  const instances = carried ? carried.instances : defaults.instances;
  /** The AC counts travel as point overrides, exactly as the itemized Points table holds them. */
  const planOverrides = carried ? carried.overrides : defaults.overrides;

  // prices come from the same catalogue call the itemized screen makes
  const [prices, setPrices] = useState<Record<string, never> | null>(null);
  const [priceError, setPriceError] = useState("");
  useEffect(() => {
    let cancelled = false;
    void fetchLivePrices()
      .then((live) => {
        if (!cancelled) setPrices(live as Record<string, never>);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const live = useMemo(
    () =>
      liveEstimate({
        templateId,
        specLevel,
        spaces: planSpaces,
        prices: (prices ?? {}) as Parameters<typeof liveEstimate>[0]["prices"],
        overrides: planOverrides,
        specialLoadInstances: instances,
      }),
    [templateId, specLevel, planSpaces, prices, carried, instances],
  );

  /**
   * The itemized bill is the price. When it has published a bill, these are its own lines
   * and its own total; only a plan that has never been opened itemized is priced here.
   */
  const estimateLines =
    carried?.bill?.lines ??
    live.lines.map((line) => ({
      name: line.catalogueName,
      quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
      unit: line.catalogueUnit,
      priceGhs: line.unitPrice,
    }));
  const total = carried?.bill?.totalGhs ?? live.total;
  const pricedCountValue = carried?.bill
    ? carried.bill.lines.filter((line) => line.priceGhs != null).length
    : live.pricedCount;
  const fittingsLabel = FITTINGS.find((entry) => entry.value === quality)?.label ?? "Standard";
  const spaces = planSpaces.length;

  /**
   * The itemized screen restores this exact plan: spaces, point overrides and the special
   * loads, so the two screens cannot drift apart on the way there or on the way back.
   */
  const openItemized = () => {
    try {
      localStorage.setItem(
        "estimo_estimate_draft_v1",
        JSON.stringify({
          templateId,
          specLevel,
          spaces: planSpaces,
          overrides: planOverrides,
          specialLoadInstances: instances,
        }),
      );
    } catch {}
    router.push(`/itemized?template=${encodeURIComponent(type.code)}&quality=${quality}`);
  };

  const estimateQuery = () => {
    const params = new URLSearchParams({ template: type.code, quality });
    for (const field of type.fields) params.set(field.key, String(counts[field.key] ?? 0));
    return `/estimate?${params.toString()}`;
  };

  /** The simple estimate downloads the same document the itemized page produces. */
  const downloadSimplePdf = async () => {
    const body = JSON.stringify({
      name: `${type.label} estimate`,
      template: type.code,
      specLevel,
      subtitle: `${planSpaces.length} spaces · ${specLevel}`,
      items: estimateLines,
      total,
      specialLoads: [],
    });

    const save = async (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${type.code.toLowerCase()}-estimate.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    };

    const direct = await fetch("/api/estimates/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (direct.ok) {
      await save(await direct.blob());
      return;
    }
    if (direct.status !== 401) return;

    const linkResponse = await fetch("/api/estimates/pdf/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!linkResponse.ok) return;
    const signed = (await linkResponse.json()) as { url?: string };
    if (!signed.url) return;
    const linked = await fetch(signed.url);
    if (linked.ok) await save(await linked.blob());
  };

  /**
   * Counting a room here starts a fresh plan: the itemized bill priced the rooms as they
   * were, so it is set aside and this plan is priced in its place.
   */
  const resetToCounters = () => {
    setCarried(null);
    try {
      localStorage.removeItem("estimo_estimate_draft_v1");
    } catch {}
  };

  /**
   * Changing the specification keeps the plan (spaces, overrides, special loads) but not
   * the bill, which was priced for the old specification: it is dropped and the plan is
   * priced again at the new one, and the itemized screen is handed the new choice.
   */
  const changeQuality = (next: FittingQuality) => {
    const nextSpec = specLevelForQuality(next);
    setSpecLevel(nextSpec);
    if (!carried) return;
    setCarried({ ...carried, bill: null });
    try {
      localStorage.setItem(
        "estimo_estimate_draft_v1",
        JSON.stringify({
          templateId,
          specLevel: nextSpec,
          spaces: carried.spaces,
          overrides: carried.overrides,
          specialLoadInstances: carried.instances,
        }),
      );
    } catch {}
  };

  const changeSpace = (key: string, delta: number) => {
    // editing the counters means going back to the counter-built plan
    resetToCounters();
    setCounts((current) => ({ ...current, [key]: clampCount(type.code, key, (current[key] ?? 0) + delta) }));
  };

  const toggleSpace = (key: string) => {
    setOpenSpaces((current) => (current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]));
  };

  const saveForLater = () => {
    const saved = saveEstimate({
      name: `${type.label} estimate`,
      kind: "quick",
      detail: `${type.label} · ${fittingsLabel} fittings · ${spaces} spaces`,
      totalGhs: total > 0 ? total : null,
      template: type.code,
      counts,
      quality,
    });
    void pushCreate(saved);
    setSaved(true);
  };

  return (
    <main className="container page-shell">
      <div className="setup-layout">
        <div>
          <Link className="back-link" href="/">Back to project types</Link>
          <h1 className="page-title">Set up your {type.label.toLowerCase()}</h1>
          <p className="page-sub">These are starting points. Change anything that does not match your plan.</p>

          <ProjectTypeSelect template={type.code} onChange={(value) => router.push(`/quick-estimate?template=${value}`)} />

          <section className="setup-section">
            <h2 className="section-title">Spaces</h2>
            {type.fields.map((field) => {
              const open = openSpaces.includes(field.key);
              const count = counts[field.key] ?? 0;
              return (
                <div className={open ? "room-block is-open" : "room-block"} key={field.key}>
                  <div className="room-row">
                    <button
                      className="room-trigger"
                      type="button"
                      aria-expanded={open}
                      onClick={() => toggleSpace(field.key)}
                    >
                      <span className="room-copy">
                        <strong>{field.label}</strong>
                        <span>{field.note}</span>
                      </span>
                      <svg className="room-chevron" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true">
                        <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div className="stepper">
                      <button
                        type="button"
                        onClick={() => changeSpace(field.key, -1)}
                        disabled={count <= minimumCount(type.code, field.key)}
                        aria-label={`Fewer ${field.label}`}
                      >
                        −
                      </button>
                      <span aria-live="polite">{count}</span>
                      <button type="button" onClick={() => changeSpace(field.key, 1)} aria-label={`More ${field.label}`}>+</button>
                    </div>
                  </div>
                  {open ? (
                    <div className="room-panel">
                      {count > 0 ? (
                        <>
                          <p className="room-panel-note">
                            {count} × {field.label.toLowerCase()} included
                          </p>
                          <ul className="room-panel-list">
                            {field.items.map((item) => {
                              const quantity = itemQuantity(item) * count;
                              return (
                                <li key={item.name}>
                                  <span>{item.name}</span>
                                  <strong>
                                    {quantity} <small>{item.unit}{quantity === 1 ? "" : "s"}</small>
                                  </strong>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      ) : (
                        <p className="room-panel-note">No {field.label.toLowerCase()} in this estimate yet.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>

          <section className="setup-section">
            <h2 className="section-title">Quality of fittings</h2>
            <div className="option-grid">
              {FITTINGS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={quality === option.value ? "option-card is-active" : "option-card"}
                  onClick={() => changeQuality(option.value)}
                  aria-pressed={quality === option.value}
                >
                  <strong>{option.label}</strong>
                  <span>{option.note}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="side-card">
          <h2 className="side-title">Your estimate so far</h2>
          <dl className="side-rows">
            <div><dt>Project</dt><dd>{type.label}</dd></div>
            <div><dt>Spaces</dt><dd>{spaces}</dd></div>
            <div><dt>Fittings</dt><dd>{fittingsLabel}</dd></div>
          </dl>
          <div className="side-divider" />
          <span className="side-label">Estimated total</span>
          <strong className="side-total">{money(total)}</strong>
          <p className="side-note">
            {pricedCountValue} of {estimateLines.length} priced ·{" "}
            {carried?.bill ? "priced by the itemized bill" : "updates as you change the spaces"}.
          </p>
          <button className="btn-outline side-secondary" type="button" onClick={() => void downloadSimplePdf()}>
            Download PDF
          </button>
          <button className="btn-amber side-cta" type="button" onClick={openItemized}>
            Itemized estimate
          </button>
          {saved ? (
            <Link className="link-button side-link" href="/projects">Saved — view saved projects</Link>
          ) : (
            <button className="link-button side-link" type="button" onClick={saveForLater}>Save for later</button>
          )}
          <p className="side-fineprint">Illustrative preliminary estimate, not a live supplier price.</p>
        </aside>
      </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<main className="container page-shell"><p className="page-sub">Loading setup…</p></main>}>
      <SetupContent />
    </Suspense>
  );
}

