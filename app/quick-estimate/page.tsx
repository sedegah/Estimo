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
  defaultSpecialLoadsFor,
  fetchLivePrices,
  liveEstimate,
  spacesFromCounts,
  specLevelForQuality,
  TEMPLATE_FOR_CODE,
  templateForCode,
} from "@/lib/estimate-live";
import { parseSpecialLoadInstances, type SpecialLoadInstance } from "@/lib/quantity-engine/special-loads";
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
  const [quality, setQuality] = useState<FittingQuality>(
    (searchParams.get("quality") as FittingQuality) || "standard",
  );
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
  const specLevel = specLevelForQuality(quality);

  /**
   * The itemized bill lets a person edit the plan (spaces, point overrides, special
   * loads). Coming back here must show that same plan and the same money, so the draft
   * it left behind is picked up and priced instead of a fresh guess from the counters.
   */
  const [carried, setCarried] = useState<{
    spaces: SpaceInput[];
    overrides: PointOverride[];
    instances: SpecialLoadInstance[];
  } | null>(null);

  useEffect(() => {
    /**
     * Reads the take-off the itemized bill left behind. It is re-read whenever the page
     * becomes visible again, so coming back from an edit there is always reflected here.
     */
    const read = () => {
      try {
        const raw = localStorage.getItem("estimo_estimate_draft_v1");
        if (!raw) {
          setCarried(null);
          return;
        }
        const draft = JSON.parse(raw) as {
          templateId?: string;
          spaces?: SpaceInput[];
          overrides?: PointOverride[];
          specialLoadInstances?: unknown[];
        };
        if (draft.templateId !== templateId || !draft.spaces?.length) {
          setCarried(null);
          return;
        }
        setCarried({
          spaces: draft.spaces,
          overrides: draft.overrides ?? [],
          instances: parseSpecialLoadInstances(draft.specialLoadInstances),
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
   * The rulebook's default loads (the kitchen fridge) are part of the plan: the itemized
   * bill always prices them, so this screen must too, whether or not it names them.
   */
  const instances = useMemo(
    () => (carried ? carried.instances : defaultSpecialLoadsFor(templateId, planSpaces)),
    [carried, templateId, planSpaces],
  );

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
        overrides: carried?.overrides,
        specialLoadInstances: instances,
      }),
    [templateId, specLevel, planSpaces, prices, carried, instances],
  );

  const total = live.total;
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
          overrides: carried?.overrides ?? [],
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
      items: live.lines.map((line) => ({
        name: line.catalogueName,
        quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
        unit: line.catalogueUnit,
        priceGhs: line.unitPrice,
      })),
      total: live.total,
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

  const changeSpace = (key: string, delta: number) => {
    // editing the counters means going back to the counter-built plan
    setCarried(null);
    setCounts((current) => ({ ...current, [key]: clampCount(type.code, key, (current[key] ?? 0) + delta) }));
  };

  /** Drops the edited take-off and prices the counters again. */
  const useCounters = () => {
    setCarried(null);
    try {
      localStorage.removeItem("estimo_estimate_draft_v1");
    } catch {}
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
                  onClick={() => setQuality(option.value)}
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
            {live.pricedCount} of {live.lines.length} priced ·{" "}
            {carried ? "carried over from the itemized bill" : "updates as you change the spaces"}.
          </p>
          {carried ? (
            <button className="link-button side-link" type="button" onClick={useCounters}>
              Price the counters instead
            </button>
          ) : null}
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

