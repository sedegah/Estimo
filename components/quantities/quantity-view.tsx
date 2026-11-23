"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calculateProject, rulesByKey } from "@/lib/quantity-engine/engine";
import { priceQuantities } from "@/lib/quantity-engine/catalogue";
import type { PriceEntry } from "@/lib/quantity-engine/catalogue";
import type {
  AssemblyItemRow,
  AssemblyRow,
  CircuitRuleRow,
  PointOverride,
  PointType,
  RoomRuleRow,
  SpaceInput,
  SpecLevel,
} from "@/lib/quantity-engine/types";
import type { CatalogueMaterialInfo } from "@/lib/quantity-engine/catalogue";
import { readBasket, writeBasket } from "@/lib/storage/basket";
import { listSavedEstimates, saveEstimate, updateSavedEstimate } from "@/lib/storage/saved-estimates";
import { pushCreate, pushUpdate } from "@/lib/api/estimates";
import type { BasketItem } from "@/lib/types";

interface TemplateSummary {
  id: string;
  name: string;
  projectType: string;
  sizeClass: string;
  description: string;
  spaceCount: number;
}

interface Props {
  signedIn?: boolean;
  templateCode?: string;
  initialTemplateId?: string;
  /** Priced-estimate editor link, so the classic flow stays reachable. */
  estimateHref?: string;
  projectTypes: { key: string; label: string }[];
  templates: TemplateSummary[];
  spacesByTemplate: Record<string, SpaceInput[]>;
  rules: RoomRuleRow[];
  params: Record<string, number>;
  circuitRules: CircuitRuleRow[];
  assemblies: AssemblyRow[];
  assemblyItems: AssemblyItemRow[];
  catalogue: Record<string, CatalogueMaterialInfo>;
  prices: Record<string, PriceEntry>;
  specialLoads?: { load_key: string; space_context: string; selection_mode: string; default_enabled: boolean; circuit_policy: string; notes: string }[];
}

const SPECS: { key: SpecLevel; label: string }[] = [
  { key: "economy", label: "Economy" },
  { key: "standard", label: "Standard" },
  { key: "premium", label: "Premium" },
];

const SIZE_LABEL: Record<string, string> = { compact: "Compact", standard: "Standard", large: "Large" };

const POINT_FIELDS: { type: PointType; label: string; key: keyof SpaceInputResult }[] = [
  { type: "lighting", label: "Lights", key: "lighting_points" },
  { type: "double_sockets", label: "Sockets", key: "double_sockets" },
  { type: "fans", label: "Fans", key: "fan_points" },
  { type: "ac", label: "AC", key: "ac_points" },
  { type: "tv", label: "TV", key: "tv_points" },
  { type: "data", label: "Data", key: "data_points" },
  { type: "switches", label: "Switches", key: "switch_positions" },
];

type SpaceInputResult = {
  lighting_points: number;
  double_sockets: number;
  fan_points: number;
  ac_points: number;
  tv_points: number;
  data_points: number;
  switch_positions: number;
};

/** Catalogue units read badly on a bill of quantities: "No." becomes "pcs". */
const UNIT_LABEL: Record<string, string> = {
  "No.": "pcs",
  "length": "lengths",
  "m": "m",
  "set": "sets",
  "bag": "bags",
  "roll": "rolls",
  "strip": "strips",
  "box": "boxes",
  "coil": "coils",
  "pair": "pairs",
};

const LOAD_LABELS: Record<string, string> = {
  refrigerator: "Fridge",
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
  refrigeration_equipment: "Refrigeration plant",
};

const money = (value: number | null) =>
  value === null || value === undefined
    ? "—"
    : `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function QuantityView(props: Props) {
  const firstTemplate =
    props.templates.find((template) => template.id === props.initialTemplateId) ??
    props.templates.find((template) => template.projectType === "two_bedroom") ??
    props.templates[0];
  const [projectType, setProjectType] = useState(firstTemplate.projectType);
  const [templateId, setTemplateId] = useState(firstTemplate.id);
  const [specLevel, setSpecLevel] = useState<SpecLevel>("standard");
  const [spaces, setSpaces] = useState<SpaceInput[]>(props.spacesByTemplate[firstTemplate.id] ?? []);
  const [overrides, setOverrides] = useState<PointOverride[]>([]);
  const [added, setAdded] = useState("");
  const [loads, setLoads] = useState<string[]>(() =>
    (props.specialLoads ?? []).filter((load) => load.default_enabled).map((load) => load.load_key),
  );

  /** Loads offered for the rooms in this plan, per the rulebook's space_context. */
  const availableLoads = useMemo(() => {
    const contexts = new Set<string>(["building"]);
    for (const space of spaces) {
      const type = space.room_type;
      if (type === "kitchen") { contexts.add("kitchen"); contexts.add("kitchen_or_utility"); contexts.add("kitchen_or_bathroom"); }
      if (type === "utility_room") contexts.add("kitchen_or_utility");
      if (type === "bathroom" || type === "wc") { contexts.add("bathroom"); contexts.add("kitchen_or_bathroom"); }
      if (["bedroom", "living_room", "dining_room", "private_office", "meeting_room", "reception"].includes(type)) contexts.add("habitable_room");
      if (type === "workshop") { contexts.add("workshop"); contexts.add("shop_or_workshop"); }
      if (type === "shop_floor" || type === "store") contexts.add("shop_or_workshop");
      if (type === "porch_veranda" || type === "external_area") contexts.add("external");
      if (type === "garage") contexts.add("garage");
    }
    const rows = props.specialLoads ?? [];
    return [...rows].sort((a, b) => {
      const score = (row: { space_context: string }) => (contexts.has(row.space_context) ? 0 : 1);
      return score(a) - score(b);
    });
  }, [props.specialLoads, spaces]);

  // The working estimate is kept in this browser, signed in or not.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("estimo_estimate_draft_v1");
      if (!raw) return;
      const draft = JSON.parse(raw) as { templateId?: string; specLevel?: SpecLevel; spaces?: SpaceInput[]; overrides?: PointOverride[]; loads?: string[] };
      if (draft.templateId === templateId && draft.spaces?.length) {
        setSpecLevel(draft.specLevel ?? "standard");
        setSpaces(draft.spaces);
        setOverrides(draft.overrides ?? []);
        if (Array.isArray(draft.loads)) setLoads(draft.loads);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("estimo_estimate_draft_v1", JSON.stringify({ templateId, specLevel, spaces, overrides, loads }));
    } catch {}
  }, [templateId, specLevel, spaces, overrides, loads]);
  const [livePrices, setLivePrices] = useState<Record<string, PriceEntry>>(props.prices);

  // Prices arrive after the page: the catalogue call is edge-cached and the page
  // itself stays static, so the estimate opens immediately.
  useEffect(() => {
    if (Object.keys(props.prices).length) setLivePrices(props.prices);
  }, [props.prices]);

  useEffect(() => {
    if (Object.keys(livePrices).length) return;
    const base = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? "https://estimo-api.sedegahkimathi.workers.dev";
    const ids = new Set(Object.keys(props.catalogue));
    if (!ids.size) return;
    let cancelled = false;
    void fetch(`${base}/catalogue`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { items?: { id: string; price_ghs: number | null; price_brand?: string | null; price_source?: string | null; price_updated_at?: string | null }[] } | null) => {
        if (cancelled || !body?.items) return;
        const next: Record<string, PriceEntry> = {};
        for (const item of body.items) {
          if (!ids.has(item.id) || typeof item.price_ghs !== "number") continue;
          next[item.id] = {
            price: item.price_ghs,
            brand: item.price_brand ?? null,
            source: item.price_source ?? null,
            updatedAt: item.price_updated_at ?? null,
          };
        }
        setLivePrices(next);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [livePrices, props.catalogue]);

  const templateName =
    props.templates.find((template) => template.id === templateId)?.name ?? "Project";

  const templatesForType = useMemo(
    () => props.templates.filter((template) => template.projectType === projectType),
    [props.templates, projectType],
  );

  const rules = useMemo(() => rulesByKey(props.rules), [props.rules]);

  const roomTypes = useMemo(
    () =>
      Array.from(new Set(props.rules.filter((rule) => rule.spec_level === specLevel).map((rule) => rule.room_type))).sort(),
    [props.rules, specLevel],
  );

  const result = useMemo(
    () =>
      calculateProject({
        spaces,
        specLevel,
        projectType,
        templateId,
        overrides,
        specialLoads: loads,
        params: props.params,
        rules,
        circuitRules: props.circuitRules,
        assemblies: props.assemblies,
        assemblyItems: props.assemblyItems,
      }),
    [spaces, specLevel, projectType, templateId, overrides, loads, props, rules],
  );

  const auto = useMemo(
    () =>
      calculateProject({
        spaces,
        specLevel,
        projectType,
        templateId,
        params: props.params,
        rules,
        circuitRules: props.circuitRules,
        assemblies: props.assemblies,
        assemblyItems: props.assemblyItems,
      }),
    [spaces, specLevel, projectType, templateId, props, rules],
  );

  const catalogueMap = useMemo(() => new Map(Object.entries(props.catalogue)), [props.catalogue]);
  const lines = useMemo(
    () => priceQuantities(result.materialQuantities, livePrices, catalogueMap),
    [result.materialQuantities, livePrices, catalogueMap],
  );

  const total = lines.reduce((sum, line) => sum + (line.amount ?? 0), 0);
  const pricedCount = lines.filter((line) => line.amount !== null).length;

  const pickProjectType = (key: string) => {
    setProjectType(key);
    const next = props.templates.find((template) => template.projectType === key);
    if (next) {
      setTemplateId(next.id);
      setSpaces(props.spacesByTemplate[next.id] ?? []);
      setOverrides([]);
      setAdded("");
    }
  };

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    setSpaces(props.spacesByTemplate[id] ?? []);
    setOverrides([]);
    setAdded("");
  };

  const updateSpace = (id: string, patch: Partial<SpaceInput>) => {
    setSpaces((current) => current.map((space) => (space.id === id ? { ...space, ...patch } : space)));
    setAdded("");
  };

  const addSpace = () => {
    setSpaces((current) => [
      ...current,
      {
        id: `space-${Date.now()}`,
        space_name: `Space ${current.length + 1}`,
        room_type: "living_room",
        length_m: 4,
        width_m: 3,
        height_m: 3,
        quantity: 1,
      },
    ]);
    setAdded("");
  };

  const duplicateSpace = (space: SpaceInput) => {
    setSpaces((current) => {
      const index = current.findIndex((entry) => entry.id === space.id);
      const copy: SpaceInput = { ...space, id: `space-${Date.now()}`, space_name: `${space.space_name} 2` };
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
    });
    setAdded("");
  };

  const removeSpace = (id: string) => {
    setSpaces((current) => current.filter((space) => space.id !== id));
    setOverrides((current) => current.filter((override) => override.space_id !== id));
    setAdded("");
  };

  const setOverride = (spaceId: string, type: PointType, raw: string) => {
    setOverrides((current) => {
      const without = current.filter((override) => !(override.space_id === spaceId && override.point_type === type));
      if (raw.trim() === "") return without;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) return without;
      return [...without, { space_id: spaceId, point_type: type, value, source: "user_override" }];
    });
  };

  /** One action: files the estimate under Saved projects and fills the basket. */
  const saveEstimateNow = () => {
    const counts = {
      lights: result.totals.lighting_points,
      sockets: result.totals.double_sockets,
      switches: result.totals.switch_positions,
      fans: result.totals.fan_points,
      data: result.totals.data_points,
      spaces: result.spaces.length,
    };
    const existing = listSavedEstimates().find(
      (entry) => entry.quantities?.templateId === templateId && entry.quantities?.specLevel === specLevel,
    );
    const payload = {
      name: `${templateName} estimate`,
      kind: "quick" as const,
      detail: `${templateName} · ${specLevel} · ${result.totals.floor_area_m2} m² · ${result.totals.total_final_circuits} circuits`,
      totalGhs: total > 0 ? Math.round(total * 100) / 100 : null,
      template: props.templateCode ?? "HOME-2B",
      counts,
      quality: specLevel,
      items: lines.map((line) => ({
        name: line.catalogueName,
        quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
        unit: line.catalogueUnit,
        priceGhs: line.unitPrice,
      })),
      quantities: {
        templateId,
        specLevel,
        ruleSet: "ESTIMO-GH-QTY-v1.0",
        spaces,
        overrides,
        specialLoads: loads,
      },
    };
    const saved = existing ? updateSavedEstimate(existing.id, payload) : saveEstimate(payload);
    if (!saved) return null;
    if (props.signedIn) {
      if (existing) void pushUpdate(saved);
      else void pushCreate(saved);
    }
    return saved;
  };

  const autoFor = (spaceId: string, key: keyof SpaceInputResult) => {
    const space = auto.spaces.find((entry) => entry.space_id === spaceId);
    return space ? Number(space[key]) : 0;
  };

  /** Every line goes in, priced or not, so the estimate shows the full take-off. */
  /** Adds the take-off to the basket and files it under Saved projects in one go. */
  const addToEstimate = () => {
    const groupId = `qty:${templateId}:${specLevel}`;
    const groupName = `${templateName} · ${specLevel}`;
    const lines_: BasketItem[] = lines.map((line) => ({
      materialId: line.catalogueId,
      name: line.catalogueName,
      category: "Quantity take-off",
      unit: line.catalogueUnit,
      quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
      priceGhs: line.unitPrice,
      brandName: line.brand,
      supplierName: "ESTIMO catalogue",
      verifiedAt: new Date().toISOString().slice(0, 10),
      groupId,
      groupName,
    }));
    if (!lines_.length) return;

    // only this estimate's own lines are replaced; other estimates keep theirs
    const rest = readBasket().filter(
      (item) => !(item.groupId === groupId && lines_.some((line) => line.materialId === item.materialId)),
    );
    writeBasket([...rest, ...lines_]);

    const saved = saveEstimateNow();
    const where = props.signedIn ? "your account" : "this browser";
    setAdded(
      saved
        ? `${lines_.length} materials added and saved to ${where}.`
        : `${lines_.length} materials added to your estimate.`,
    );
  };

  return (
    <div className="quantities">
      <section className="quantities-controls">
        <label className="quantities-field">
          <span>Project</span>
          <select value={projectType} onChange={(event) => pickProjectType(event.target.value)}>
            {props.projectTypes.map((type) => (
              <option key={type.key} value={type.key}>{type.label}</option>
            ))}
          </select>
        </label>

        <label className="quantities-field">
          <span>Template</span>
          <select value={templateId} onChange={(event) => pickTemplate(event.target.value)}>
            {templatesForType.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>

        <div className="quantities-field">
          <span>Specification</span>
          <div className="quantities-specs" role="group" aria-label="Specification level">
            {SPECS.map((spec) => (
              <button
                key={spec.key}
                type="button"
                className={specLevel === spec.key ? "is-active" : ""}
                onClick={() => { setSpecLevel(spec.key); setOverrides([]); setAdded(""); }}
              >
                {spec.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="quantities-summary" aria-label="Engineering summary">
        <div><span>Floor area</span><strong>{result.totals.floor_area_m2} m²</strong></div>
        <div><span>Light points</span><strong>{result.totals.lighting_points}</strong></div>
        <div><span>Double sockets</span><strong>{result.totals.double_sockets}</strong></div>
        <div><span>Final circuits</span><strong>{result.totals.total_final_circuits}</strong></div>
        <div><span>Special loads</span><strong>{loads.length}</strong></div>
        <div><span>Board</span><strong>{result.totals.recommended_db_ways ? `${result.totals.recommended_db_ways} way` : "Engineered"}</strong></div>
        <div><span>Conduit</span><strong>{result.totals.total_containment_m} m</strong></div>
      </section>

      {result.warnings.length ? (
        <ul className="quantities-warnings">
          {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      ) : null}

      <section className="quantities-section">
          <div className="quantities-section-head is-inline">
          <h2>Spaces</h2>
          <button className="btn-outline btn-small" type="button" onClick={addSpace}>Add space</button>
        </div>
        <div className="quantities-scroll">
          <table className="quantities-table">
            <thead>
              <tr>
                <th>Space</th>
                <th>Room type</th>
                <th>L</th>
                <th>W</th>
                <th>H</th>
                <th>Qty</th>
                <th className="is-num">Area</th>
                <th>Points</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result.spaces.map((space) => {
                const source = spaces.find((entry) => entry.id === space.space_id);
                if (!source) return null;
                return (
                  <tr key={space.space_id}>
                    <td>{space.space_name}</td>
                    <td>
                      <select
                        className="quantities-room"
                        value={source.room_type}
                        onChange={(event) => updateSpace(space.space_id, { room_type: event.target.value })}
                      >
                        {roomTypes.map((type) => (
                          <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number" min={1} step={0.1} value={source.length_m}
                        onChange={(event) => updateSpace(space.space_id, { length_m: Math.max(1, Number(event.target.value) || 1) })}
                      />
                    </td>
                    <td>
                      <input
                        type="number" min={1} step={0.1} value={source.width_m}
                        onChange={(event) => updateSpace(space.space_id, { width_m: Math.max(1, Number(event.target.value) || 1) })}
                      />
                    </td>
                    <td>
                      <input
                        type="number" min={2} step={0.1} value={source.height_m}
                        onChange={(event) => updateSpace(space.space_id, { height_m: Math.max(2, Number(event.target.value) || 2) })}
                      />
                    </td>
                    <td>
                      <input
                        type="number" min={1} step={1} value={source.quantity ?? 1}
                        onChange={(event) => updateSpace(space.space_id, { quantity: Math.max(1, Math.round(Number(event.target.value) || 1)) })}
                      />
                    </td>
                    <td className="is-num">{Math.round(space.area_m2 * 10) / 10} m²</td>
                    <td className="is-muted">
                      {space.lighting_points}L · {space.double_sockets}S · {space.switch_positions}Sw
                      {space.data_points ? ` · ${space.data_points}D` : ""}
                    </td>
                    <td className="is-actions">
                      <button className="quantities-icon-btn" type="button" onClick={() => duplicateSpace(source)} aria-label={`Duplicate ${space.space_name}`}>+</button>
                      <button className="quantities-icon-btn is-danger" type="button" onClick={() => removeSpace(space.space_id)} aria-label={`Remove ${space.space_name}`}>×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="quantities-section">
        <div className="quantities-section-head">
          <h2>Points</h2>
        </div>
        <div className="quantities-overrides">
          {result.spaces.map((space) => (
            <div className="quantities-override" key={space.space_id}>
              <strong>{space.space_name}</strong>
              {POINT_FIELDS.map((field) => {
                const current = overrides.find(
                  (override) => override.space_id === space.space_id && override.point_type === field.type,
                );
                return (
                  <label key={field.type}>
                    <span>{field.label}</span>
                    <input
                      type="number"
                      min={0}
                      placeholder={String(autoFor(space.space_id, field.key))}
                      value={current ? current.value : ""}
                      onChange={(event) => setOverride(space.space_id, field.type, event.target.value)}
                    />
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="quantities-section">
        <div className="quantities-section-head">
          <h2>Special loads</h2>
        </div>
        <div className="quantities-loads">
          {availableLoads.map((load) => {
            const active = loads.includes(load.load_key);
            return (
              <button
                key={load.load_key}
                type="button"
                className={active ? "quantities-load is-active" : "quantities-load"}
                aria-pressed={active}
                onClick={() => {
                  setLoads((current) => (current.includes(load.load_key) ? current.filter((key) => key !== load.load_key) : [...current, load.load_key]));
                  setAdded("");
                }}
              >
                <span>{LOAD_LABELS[load.load_key] ?? load.load_key.replace(/_/g, " ")}</span>
                <small>{load.space_context.replace(/_/g, " ")}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="quantities-section">
        <div className="quantities-section-head">
          <h2>Materials</h2>
        </div>
        <div className="quantities-scroll">
          <table className="quantities-table">
            <thead>
              <tr>
                <th>Material</th>
                <th className="is-num">Quantity</th>
                <th className="is-num">Engineering</th>
                <th className="is-num">Unit price</th>
                <th className="is-num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const measured = line.catalogueUnit === "length" || line.catalogueUnit === "m";
                const orderUnit = line.catalogueUnit === "length" ? "lengths" : line.catalogueUnit;
                return (
                  <tr key={line.catalogueId}>
                    <td>
                      <div className="quantities-material">
                        <Link href={`/catalogue/${line.catalogueId}`}>{line.catalogueName}</Link>
                        <span className={`quantities-confidence is-${line.confidence}`}>{line.confidence}</span>
                      </div>
                    </td>
                    <td className="is-num">
                      {line.purchaseQuantity}
                      <span className="quantities-unit">{UNIT_LABEL[line.catalogueUnit] ?? line.catalogueUnit.toLowerCase()}</span>
                    </td>
                    <td className="is-num is-muted">
                      {measured ? `${line.engineeringQuantity} m` : "—"}
                    </td>
                    <td className="is-num">{line.unitPrice === null ? "Pending" : money(line.unitPrice)}</td>
                    <td className="is-num">{line.amount === null ? "—" : money(line.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loads.length ? (
          <div className="quantities-loads-summary">
            <div>
              <h3>Special loads</h3>
              <p>Concluded by phone call or WhatsApp.</p>
            </div>
            <ul>
              {loads.map((key) => (
                <li key={key}>{LOAD_LABELS[key] ?? key.replace(/_/g, " ")}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="quantities-total">
          <div>
            <span>{pricedCount} of {lines.length} materials priced</span>
            <strong>{money(total)}</strong>
          </div>
          <button className="btn-amber" type="button" onClick={addToEstimate} disabled={!lines.length}>
            Add {lines.length} materials to estimate
          </button>
        </div>
        {added ? <p className="quantities-added">{added} <Link href="/projects">Saved estimates</Link></p> : null}
      </section>
    </div>
  );
}
