"use client";
import { displayMoneyPayload } from "@/lib/currency";
import { useCurrency } from "@/components/currency/currency-provider";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import {
  catalogueMap,
  fetchLivePrices,
  defaultPlanAdditions,
  liveEstimate,
  PROJECT_TYPE_FOR_CODE,
  spacesFromCounts,
  specLevelForQuality,
  qualityForSpecLevel,
  TEMPLATE_FOR_CODE,
} from "@/lib/estimate-live";
import { touchSavedEstimate } from "@/lib/storage/saved-estimates";
import { priceQuantities } from "@/lib/quantity-engine/catalogue";
import type { PointOverride, SpaceInput, SpecLevel } from "@/lib/quantity-engine/types";
import type { PriceEntry } from "@/lib/quantity-engine/catalogue";
import { formatDate, formatGhs } from "@/lib/format";
import { pricedCount, pricedTotal } from "@/lib/estimate-total";
import { unitLabel } from "@/lib/format";
import {
  SAVED_EVENT,
  deleteSavedEstimate,
  getSavedEstimate,
  updateSavedEstimate,
} from "@/lib/storage/saved-estimates";
import { pushDelete, pushUpdate } from "@/lib/api/estimates";
import {
  STATUS_LABEL,
  configurationStatus,
  specialLoadDefinition,
  specialLoadLabels,
  specialLoadSummary,
} from "@/lib/quantity-engine/special-loads";
import type { SavedEstimate } from "@/lib/types";

const clamp = (value: number) => Math.max(0, Math.min(20, Math.round(value)));

const LOAD_NAMES: Record<string, string> = {
  refrigerator: "Refrigerator",
  freezer: "Freezer",
  microwave: "Microwave",
  electric_cooker: "Electric cooker",
  dishwasher: "Dishwasher",
  washing_machine: "Washing machine",
  extractor: "Extractor",
  water_heater: "Water heater",
  air_conditioner: "Air conditioner",
  water_pump: "Water pump",
  gate_motor: "Gate motor",
  ev_charger: "EV charger",
  workshop_machine: "Workshop machine",
  refrigeration_equipment: "Refrigeration equipment",
};

const loadName = (key: string) =>
  LOAD_NAMES[key] ?? key.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
const itemQuantity = (item: SpaceItem) =>
  item.lights ?? item.sockets ?? item.acs ?? item.heaters ?? item.switches ?? item.cooking ?? 0;

export default function ProjectPage() {
  // subscribe to the display currency so a change re-renders this view's prices
  useCurrency();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<SavedEstimate | null>(null);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("HOME-2B");
  const [counts, setCounts] = useState<Counts>({});
  const [quality, setQuality] = useState<FittingQuality>("standard");
  const [openSpaces, setOpenSpaces] = useState<string[]>([]);
  const [savedMessage, setSavedMessage] = useState("");
  const [legacy, setLegacy] = useState(false);

  useEffect(() => {
    const sync = () => {
      const entry = getSavedEstimate(params.id);
      // opening the estimate is what keeps it inside the 40-day window
      if (entry) touchSavedEstimate(entry.id);
      setProject(entry);
      setReady(true);
      if (!entry) return;
      const nextTemplate = entry.template ?? "HOME-2B";
      const storedCounts = entry.counts ?? defaultCounts(nextTemplate);
      // stored counts may predate a rule (two washrooms in an office, say): re-apply it
      const nextCounts = Object.fromEntries(
        Object.entries(storedCounts).map(([key, value]) => [
          key,
          clampCount(nextTemplate, key, Number(value) || 0),
        ]),
      );
      setName(entry.name);
      setTemplate(nextTemplate);
      setCounts(nextCounts);
      setQuality((entry.quality as FittingQuality) ?? "standard");
      setLegacy(!entry.template || !entry.counts);
    };
    sync();
    window.addEventListener(SAVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SAVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [params.id]);

  const type = projectType(template);
  const fittingsLabel = FITTINGS.find((entry) => entry.value === quality)?.label ?? "Standard";
  const spaces = totalSpaces(counts);

  /**
   * The total comes from the same engine and catalogue the itemized bill uses, so saving
   * this project can never store a number the itemized bill disagrees with.
   */
  const templateId = TEMPLATE_FOR_CODE[type.code] ?? "T011";
  const [livePrices, setLivePrices] = useState<Record<string, PriceEntry> | null>(null);
  useEffect(() => {
    let cancelled = false;
    void fetchLivePrices()
      .then((live) => {
        if (!cancelled) setLivePrices(live);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const planSpaces = useMemo(() => spacesFromCounts(templateId, counts), [templateId, counts]);
  // the plan's own defaults (the fridge, the air conditioners) are part of the price here,
  // exactly as they are on the simple screen and the itemized bill
  const planDefaults = useMemo(
    () =>
      defaultPlanAdditions({
        projectType: PROJECT_TYPE_FOR_CODE[type.code] ?? "two_bedroom",
        templateId,
        spaces: planSpaces,
      }),
    [type.code, templateId, planSpaces],
  );
  const live = useMemo(
    () =>
      liveEstimate({
        templateId,
        specLevel: specLevelForQuality(quality),
        spaces: planSpaces,
        prices: livePrices ?? {},
        overrides: planDefaults.overrides,
        specialLoadInstances: planDefaults.instances,
      }),
    [templateId, quality, planSpaces, livePrices, planDefaults],
  );
  const total = livePrices ? live.total : null;

  /**
   * A saved take-off is re-priced with the same engine and the same catalogue as the
   * itemized bill. Its stored snapshot was taken under whatever rules and prices were
   * live that day, so showing it beside a freshly priced bill would print two numbers
   * for one project.
   */
  const savedPlanLive = useMemo(() => {
    const quantities = project?.quantities;
    if (!quantities?.spaces?.length) return null;
    return liveEstimate({
      templateId: quantities.templateId,
      specLevel: quantities.specLevel as SpecLevel,
      spaces: quantities.spaces as SpaceInput[],
      overrides: quantities.overrides as PointOverride[] | undefined,
      specialLoadInstances: quantities.specialLoadInstances ?? [],
      prices: livePrices ?? {},
    });
  }, [project, livePrices]);

  const changeSpace = (key: string, delta: number) => {
    setCounts((current) => ({ ...current, [key]: clampCount(type.code, key, (current[key] ?? 0) + delta) }));
    setSavedMessage("");
  };

  const changeTemplate = (value: string) => {
    setTemplate(value);
    setCounts(defaultCounts(value));
    setOpenSpaces([]);
    setSavedMessage("");
  };

  const toggleSpace = (key: string) => {
    setOpenSpaces((current) => (current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]));
  };

  const save = () => {
    if (!project) return;
    const updated = updateSavedEstimate(project.id, {
      name: name.trim() || project.name,
      template: type.code,
      counts,
      quality,
      totalGhs: total,
      detail: `${type.label} · ${fittingsLabel} fittings · ${spaces} spaces`,
    });
    if (updated) {
      void pushUpdate(updated);
      setProject(updated);
      setLegacy(false);
      setSavedMessage("Changes saved.");
    }
  };

  /** The document is the itemized bill: same lines and total as the screen. */
  const downloadItemizedPdf = async () => {
    if (!project) return;
    if (!livePrices) return;
    const specLevel = specLevelForQuality(quality);
    const body = JSON.stringify({
    ...displayMoneyPayload(),
      name: name.trim() || project.name,
      template: type.code,
      specLevel,
      subtitle: `${spaces} spaces · ${specLevel}`,
      items: live.lines.map((line) => ({
        name: line.catalogueName,
        quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
        unit: line.catalogueUnit,
        priceGhs: line.unitPrice,
      })),
      total: live.total,
    });

    const save = async (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
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

  const viewEstimateHref = () => {
    const search = new URLSearchParams({ template: type.code, quality });
    search.set("counts", JSON.stringify(counts));
    return `/itemized?${search.toString()}`;
  };

  if (!ready) {
    return (
      <>
        <p className="app-eyebrow">Saved project</p>
        <h1 className="app-title">Loading…</h1>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <header className="app-head">
          <div>
            <p className="app-eyebrow">Saved project</p>
            <h1 className="app-title">This project is no longer here.</h1>
            <p className="app-sub">It may have been deleted from this browser.</p>
          </div>
          <Link className="btn-amber" href="/projects">Back to saved projects</Link>
        </header>
      </>
    );
  }

  // A material list is what it says: the items that were added, with their quantities.
  // It must never be dressed up as a home estimate.
  if (project.items?.length && !project.quantities) {
    const lines = project.items ?? [];
    const priced = lines.reduce((sum, line) => (line.priceGhs == null ? sum : sum + line.priceGhs * line.quantity), 0);
    const unpriced = lines.filter((line) => line.priceGhs == null).length;
    const money = (value: number) =>
      formatGhs(value, 2);

    return (
      <>
        <header className="app-head">
          <div>
            <p className="app-eyebrow">Material list</p>
            <h1 className="app-title">{project.name}</h1>
            <p className="app-sub">
              {lines.length} material{lines.length === 1 ? "" : "s"} · saved {formatDate(project.createdAt)}
            </p>
          </div>
          <div className="settings-actions">
            <Link className="btn-outline" href="/projects">Back</Link>
            <Link className="btn-outline" href="/catalogue">Add more materials</Link>
            <button
              className="link-button"
              type="button"
              onClick={() => {
                void pushDelete(project.id);
                deleteSavedEstimate(project.id);
                router.push("/projects");
              }}
            >
              Delete list
            </button>
          </div>
        </header>

        <section className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Quantity</th>
                <th>Base unit</th>
                <th className="align-right">Unit price</th>
                <th className="align-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={`${line.name}-${index}`}>
                  <td>{line.name}</td>
                  <td className="muted-cell">{line.quantity}</td>
                  <td className="muted-cell">{line.unit}</td>
                  <td className="align-right muted-cell">{line.priceGhs == null ? "Pending" : money(line.priceGhs)}</td>
                  <td className="align-right">{line.priceGhs == null ? "—" : money(line.priceGhs * line.quantity)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>List total</td>
                <td />
                <td />
                <td />
                <td className="align-right">{priced > 0 ? money(priced) : "Pending"}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <p className="settings-note">
          {unpriced
            ? `${unpriced} item${unpriced === 1 ? "" : "s"} still awaiting a price, so the total is partial. `
            : ""}
          Quantities are what you added to the estimate. Prices are supplier list prices, not a quotation.
        </p>
      </>
    );
  }

  // A saved take-off reopens in the estimate editor with its spaces and overrides.
  if (project.quantities) {
    const takeOff = project.quantities;
    const area = takeOff.spaces.reduce(
      (sum, space) => sum + space.length_m * space.width_m * Math.max(1, space.quantity ?? 1),
      0,
    );
    const savedItems = project.items ?? [];
    /** The stored snapshot is only a fallback for when prices cannot be fetched. */
    const savedTotal = savedItems.length ? pricedTotal(savedItems) : project.totalGhs;
    const liveItems =
      savedPlanLive?.lines.map((line) => ({
        name: line.catalogueName,
        quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
        unit: line.catalogueUnit,
        priceGhs: line.unitPrice,
      })) ?? [];
    const items = livePrices && liveItems.length ? liveItems : savedItems;
    const displayTotal = livePrices && savedPlanLive ? savedPlanLive.total : savedTotal;
    const loadDetail = (takeOff.specialLoadInstances ?? []).map((instance) => {
      const entry = savedPlanLive?.result.specialLoadBreakdown.find((row) => row.instanceId === instance.id);
      const pricedMaterials = entry ? priceQuantities(entry.materials, livePrices ?? {}, catalogueMap) : [];
      return {
        name: specialLoadDefinition(instance.load_key).name,
        sizing: entry?.summary ?? specialLoadSummary(instance),
        status: STATUS_LABEL[configurationStatus(instance)],
        costGhs: entry ? pricedTotal(pricedMaterials) : null,
        unpriced: pricedMaterials.filter((line) => line.unitPrice === null).length,
      };
    });
    const loadSubtotal = loadDetail.length
      ? Math.round(loadDetail.reduce((sum, entry) => sum + (entry.costGhs ?? 0), 0) * 100) / 100
      : null;
    const loadPending = loadDetail.reduce((sum, entry) => sum + entry.unpriced, 0);
    /** The PDF is generated from this estimate's own lines, so the two always agree. */
    const downloadPdf = async () => {
      // a download is a use of the estimate, so it counts against the retention window
      touchSavedEstimate(project.id);
      const response = await fetch("/api/estimates/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
    ...displayMoneyPayload(),
          name: project.name,
          template: project.template ?? "HOME-2B",
          specLevel: takeOff.specLevel,
          subtitle: `${takeOff.spaces.length} spaces · ${takeOff.specLevel} · ${Math.round(area * 10) / 10} m²`,
          items,
          total: displayTotal ?? undefined,
          specialLoads: takeOff.specialLoads ?? [],
          specialLoadsDetail: loadDetail.map(({ unpriced: _unpriced, ...row }) => row),
          specialLoadsSubtotal: loadSubtotal,
          specialLoadsPending: loadPending,
        }),
      });
      if (response.status === 401) {
        router.push("/signin?redirect_url=" + encodeURIComponent(`/projects/${project.id}`));
        return;
      }
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    const resume = () => {
      const code = project.template ?? "HOME-2B";
      try {
        localStorage.setItem(
          "estimo_estimate_draft_v1",
          JSON.stringify({
            template: code,
            templateId: takeOff.templateId,
            specLevel: takeOff.specLevel,
            spaces: takeOff.spaces,
            overrides: takeOff.overrides ?? [],
            specialLoadInstances: takeOff.specialLoadInstances ?? [],
          }),
        );
      } catch {}
      // the itemized bill is this same take-off, editable and priced line by line: the
      // template variant and the specification must travel with it, or the bill would open
      // on the project type's default template at the default specification
      const quality = qualityForSpecLevel(takeOff.specLevel as SpecLevel);
      router.push(
        `/itemized?template=${encodeURIComponent(code)}&id=${encodeURIComponent(takeOff.templateId)}&quality=${quality}`,
      );
    };

    return (
      <>
        <header className="app-head">
          <div>
            <p className="app-eyebrow">
              Saved estimate{project.code ? ` · ${project.code}` : ""}
            </p>
            <h1 className="app-title">{project.name}</h1>
            <p className="app-sub">
              {takeOff.spaces.length} space{takeOff.spaces.length === 1 ? "" : "s"} · {takeOff.specLevel} · {Math.round(area * 10) / 10} m²
              {project.counts?.lights != null ? ` · ${project.counts.lights} lights · ${project.counts.sockets ?? 0} sockets` : ""}
              {displayTotal != null ? ` · ${formatGhs(displayTotal)}` : ""}
            </p>
          </div>
          <div className="settings-actions">
            <button className="btn-outline" type="button" onClick={downloadPdf}>
              Download PDF
            </button>
            <button className="btn-amber" type="button" onClick={resume}>Open itemized bill</button>
            <button
              className="link-button"
              type="button"
              onClick={() => {
                void pushDelete(project.id);
                deleteSavedEstimate(project.id);
                router.push("/projects");
              }}
            >
              Delete estimate
            </button>
          </div>
        </header>

        <section className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Space</th>
                <th>Room type</th>
                <th>Dimensions</th>
                <th className="align-right">Area</th>
              </tr>
            </thead>
            <tbody>
              {takeOff.spaces.map((space) => (
                <tr key={space.id}>
                  <td>{space.space_name}</td>
                  <td className="muted-cell">{space.room_type.replace(/_/g, " ")}</td>
                  <td className="muted-cell">
                    {space.length_m} × {space.width_m} × {space.height_m} m
                  </td>
                  <td className="align-right">
                    {Math.round(space.length_m * space.width_m * Math.max(1, space.quantity ?? 1) * 10) / 10} m²
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {items.length ? (
          <section className="table-card" style={{ marginTop: 16 }}>
            <div className="panel-head" style={{ padding: "14px 16px" }}>
              <h2 style={{ margin: 0, fontSize: 15 }}>Materials</h2>
              <p className="muted-cell" style={{ margin: "4px 0 0", fontSize: 12.5 }}>
                Priced as the itemized bill prices them.
              </p>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Quantity</th>
                  <th className="align-right">Unit price</th>
                  <th className="align-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((line) => (
                  <tr key={line.name}>
                    <td>{line.name}</td>
                    <td className="muted-cell">{line.quantity} {unitLabel(line.unit)}</td>
                    <td className="align-right">{line.priceGhs == null ? "Pending" : formatGhs(line.priceGhs)}</td>
                    <td className="align-right">{line.priceGhs == null ? "—" : formatGhs(line.priceGhs * line.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th />
                  <th />
                  <th className="align-right">
                    {displayTotal != null ? formatGhs(displayTotal) : "Pending"}
                    <small className="muted-cell" style={{ display: "block", fontWeight: 500 }}>
                      {pricedCount(items)} of {items.length} priced
                    </small>
                  </th>
                </tr>
              </tfoot>
            </table>
            {items.some((line) => line.priceGhs == null) ? (
              <p className="settings-note" style={{ padding: "10px 16px" }}>
                Lines marked Pending still wait for a catalogue price.
              </p>
            ) : null}
          </section>
        ) : (
          <p className="settings-note">This estimate was saved before its material list was recorded.</p>
        )}
        {(takeOff.specialLoadInstances?.length ?? 0) > 0 || (takeOff.specialLoads?.length ?? 0) > 0 ? (
          <section className="table-card" style={{ marginTop: 16 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Special load</th>
                  <th>Sizing</th>
                </tr>
              </thead>
              <tbody>
                {takeOff.specialLoadInstances?.length
                  ? takeOff.specialLoadInstances.map((instance) => (
                      <tr key={instance.id}>
                        <td>{specialLoadDefinition(instance.load_key).name}</td>
                        <td className="muted-cell">
                          {specialLoadSummary(instance)} · {STATUS_LABEL[configurationStatus(instance)]}
                        </td>
                      </tr>
                    ))
                  : (takeOff.specialLoads ?? []).map((key) => (
                      <tr key={key}>
                        <td>{loadName(key)}</td>
                        <td className="muted-cell">Concluded by phone call or WhatsApp</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <p className="settings-note">
          Rule set {takeOff.ruleSet} · saved {formatDate(project.createdAt)}
        </p>
      </>
    );
  }

  return (
    <>
      <header className="app-head">
        <div>
          <p className="app-eyebrow">Adjust estimate</p>
          <h1 className="app-title">{name || project.name}</h1>
          <p className="app-sub">
            {type.label} · saved {formatDate(project.createdAt)}
          </p>
        </div>
        <div className="settings-actions">
          <button className="btn-outline" type="button" onClick={() => void downloadItemizedPdf()}>
            Download PDF
          </button>
          <Link className="btn-amber" href={viewEstimateHref()}>Itemized bill</Link>
        </div>
      </header>

      {legacy ? (
        <p className="app-empty">
          This estimate was saved before selections were stored. Adjust the spaces below and save once to make it fully
          editable.
        </p>
      ) : null}

      <div className="setup-layout">
        <div>
          <section className="panel" style={{ marginBottom: 18 }}>
            <div className="settings-row two">
              <div className="settings-field">
                <label htmlFor="project-name">Project name</label>
                <input
                  id="project-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setSavedMessage("");
                  }}
                />
              </div>
              <div className="settings-field">
                <label htmlFor="project-type">Project type</label>
                <select id="project-type" value={template} onChange={(event) => changeTemplate(event.target.value)}>
                  {Object.entries(PROJECT_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="setup-section" style={{ marginTop: 0 }}>
            <h2 className="section-title">Spaces</h2>
            {type.fields.map((field) => {
              const open = openSpaces.includes(field.key);
              const count = counts[field.key] ?? 0;
              return (
                <div className={open ? "room-block is-open" : "room-block"} key={field.key}>
                  <div className="room-row">
                    <button className="room-trigger" type="button" aria-expanded={open} onClick={() => toggleSpace(field.key)}>
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
                          <p className="room-panel-note">{count} × {field.label.toLowerCase()} included</p>
                          <ul className="room-panel-list">
                            {field.items.map((item) => {
                              const quantity = itemQuantity(item) * count;
                              return (
                                <li key={item.name}>
                                  <span>{item.name}</span>
                                  <strong>{quantity} <small>{item.unit}{quantity === 1 ? "" : "s"}</small></strong>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      ) : (
                        <p className="room-panel-note">No {field.label.toLowerCase()} in this estimate.</p>
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
                  onClick={() => {
                    setQuality(option.value);
                    setSavedMessage("");
                  }}
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
          <h2 className="side-title">Estimate</h2>
          <dl className="side-rows">
            <div><dt>Project</dt><dd>{type.label}</dd></div>
            <div><dt>Spaces</dt><dd>{spaces}</dd></div>
            <div><dt>Fittings</dt><dd>{fittingsLabel}</dd></div>
          </dl>
          <div className="side-divider" />
          <span className="side-label">Estimated total</span>
          <strong className="side-total">{total === null ? "—" : formatGhs(total, 2)}</strong>
          <p className="side-note">
            Price of the materials in this plan, priced as the itemized bill prices them.
          </p>
          <button className="btn-amber side-cta" type="button" onClick={save}>
            {savedMessage ? "Saved" : "Save changes"}
          </button>
          <Link className="link-button side-link" href={viewEstimateHref()}>View itemized bill</Link>
          <button
            className="link-button side-link"
            type="button"
            onClick={() => {
              void pushDelete(project.id);
              deleteSavedEstimate(project.id);
              router.push("/projects");
            }}
          >
            Delete project
          </button>
          <p className="side-fineprint">Illustrative preliminary estimate, not a live supplier price.</p>
        </aside>
      </div>
    </>
  );
}

