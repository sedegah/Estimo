"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AuthScreen } from "../auth-screen";
import { LoadingScreen } from "../loading-screen";
import { listCatalogue, type CatalogueItem } from "@/lib/api";
import { calculate, listTemplates, PROJECT_TYPES, RULE_SET, SPEC_LEVELS, getTemplateSpaces } from "@/lib/quantity-engine";
import specialLoadRows from "@/lib/data/quantity-engine/special_loads.json";
import { CONFIDENCE_NOTE, priceQuantities } from "@/lib/quantity-engine/catalogue";
import type { PriceEntry, CatalogueMaterialInfo } from "@/lib/quantity-engine/catalogue";
import type { SpaceInput, SpecLevel } from "@/lib/quantity-engine/types";

const money = (value: number | null) =>
  value === null ? "Pending" : `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminQuantitiesPage() {
  const { isLoaded, isSignedIn } = useUser();
  const templates = useMemo(() => listTemplates(), []);
  const first = templates.find((template) => template.projectType === "two_bedroom") ?? templates[0];

  const [projectType, setProjectType] = useState(first.projectType);
  const [templateId, setTemplateId] = useState(first.id);
  const [specLevel, setSpecLevel] = useState<SpecLevel>("standard");
  const [spaces, setSpaces] = useState<SpaceInput[]>(() => getTemplateSpaces(first.id));
  const [items, setItems] = useState<CatalogueItem[] | null>(null);
  const [loads, setLoads] = useState<string[]>(() =>
    (specialLoadRows as { load_key: string; default_enabled: boolean }[]).filter((row) => row.default_enabled).map((row) => row.load_key),
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void listCatalogue().then((rows) => setItems(rows ?? []));
  }, [isLoaded, isSignedIn]);

  const templatesForType = templates.filter((template) => template.projectType === projectType);

  const result = useMemo(
    () => calculate({ templateId, specLevel, spaces, projectType, specialLoads: loads }),
    [templateId, specLevel, spaces, projectType, loads],
  );

  const catalogueMap = useMemo(() => {
    const map = new Map<string, CatalogueMaterialInfo>();
    for (const item of items ?? []) map.set(item.id, { id: item.id, name: item.name, unit: item.unit });
    return map;
  }, [items]);

  const prices = useMemo(() => {
    const map: Record<string, PriceEntry> = {};
    for (const item of items ?? []) {
      if (typeof item.price_ghs !== "number") continue;
      map[item.id] = { price: item.price_ghs, brand: null, source: "catalogue", updatedAt: null };
    }
    return map;
  }, [items]);

  const lines = useMemo(
    () => priceQuantities(result.materialQuantities, prices, catalogueMap),
    [result.materialQuantities, prices, catalogueMap],
  );

  const total = lines.reduce((sum, line) => sum + (line.amount ?? 0), 0);
  const priced = lines.filter((line) => line.amount !== null).length;

  const pickType = (key: string) => {
    setProjectType(key);
    const next = templates.find((template) => template.projectType === key);
    if (next) {
      setTemplateId(next.id);
      setSpaces(getTemplateSpaces(next.id));
    }
  };

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    setSpaces(getTemplateSpaces(id));
  };

  const update = (id: string, patch: Partial<SpaceInput>) => {
    setSpaces((current) => current.map((space) => (space.id === id ? { ...space, ...patch } : space)));
  };

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <AuthScreen />;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/brand/estimo-logo-horizontal-dark.png" alt="ESTIMO" />
          <span className="brand-role">admin</span>
        </div>
        <div className="topbar-right">
          <Link className="btn btn-outline-light btn-sm" href="/">Back to console</Link>
        </div>
      </header>

      <div className="body">
        <aside className="rail">
          <p className="rail-label">Manage</p>
          <Link className="rail-item" href="/">Prices</Link>
          <Link className="rail-item" href="/">Materials</Link>
          <Link className="rail-item" href="/materials/new">Add material</Link>
          <span className="rail-item is-active">Quantities</span>
          <a className="rail-item" href="/builder">Estimate builder</a>
          <Link className="rail-item" href="/?tab=settings">Settings</Link>
        </aside>

        <main className="main">
          <header className="head">
            <div>
              <h1>Material quantities</h1>
              <p>Run the quantity engine on a template, adjust the spaces, and price the take-off against the catalogue.</p>
            </div>
            <div className="head-actions">
              <span className="aq-ruleset">{RULE_SET}</span>
            </div>
          </header>

          <section className="aq-controls">
            <label className="aq-field">
              <span>Project</span>
              <select value={projectType} onChange={(event) => pickType(event.target.value)}>
                {PROJECT_TYPES.map((type) => (
                  <option key={type.key} value={type.key}>{type.label}</option>
                ))}
              </select>
            </label>
            <label className="aq-field">
              <span>Template</span>
              <select value={templateId} onChange={(event) => pickTemplate(event.target.value)}>
                {templatesForType.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} · {template.sizeClass}
                  </option>
                ))}
              </select>
            </label>
            <div className="aq-field">
              <span>Specification</span>
              <div className="aq-specs">
                {SPEC_LEVELS.map((spec) => (
                  <button key={spec.key} type="button" className={specLevel === spec.key ? "is-active" : ""} onClick={() => setSpecLevel(spec.key)}>
                    {spec.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="aq-summary">
            <div><span>Floor area</span><strong>{result.totals.floor_area_m2} m²</strong></div>
            <div><span>Light points</span><strong>{result.totals.lighting_points}</strong></div>
            <div><span>Double sockets</span><strong>{result.totals.double_sockets}</strong></div>
            <div><span>Final circuits</span><strong>{result.totals.total_final_circuits}</strong></div>
            <div><span>Special loads</span><strong>{loads.length}</strong></div>
            <div><span>Board</span><strong>{result.totals.recommended_db_ways ? `${result.totals.recommended_db_ways} way` : "Engineered"}</strong></div>
            <div><span>Conduit</span><strong>{result.totals.total_containment_m} m</strong></div>
          </section>

          {result.warnings.length ? (
            <ul className="aq-warnings">
              {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          ) : null}

          <section className="panel" style={{ marginTop: 16 }}>
            <div className="panel-head"><h2>Special loads</h2></div>
            <div className="aq-loads">
              {(specialLoadRows as { load_key: string; space_context: string; default_enabled: boolean }[]).map((load) => {
                const active = loads.includes(load.load_key);
                return (
                  <button
                    key={load.load_key}
                    type="button"
                    className={active ? "aq-load is-active" : "aq-load"}
                    aria-pressed={active}
                    onClick={() => setLoads((current) => (current.includes(load.load_key) ? current.filter((key) => key !== load.load_key) : [...current, load.load_key]))}
                  >
                    {load.load_key.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel" style={{ marginTop: 16 }}>
            <div className="panel-head"><h2>Spaces</h2></div>
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr><th>Space</th><th>Room type</th><th>L</th><th>W</th><th>H</th><th>Qty</th><th>Area</th><th>Points</th></tr>
                </thead>
                <tbody>
                  {result.spaces.map((space) => {
                    const source = spaces.find((entry) => entry.id === space.space_id);
                    if (!source) return null;
                    return (
                      <tr key={space.space_id}>
                        <td>{space.space_name}</td>
                        <td className="cell-muted">{space.room_type.replace(/_/g, " ")}</td>
                        <td><input className="aq-input" type="number" min={1} step={0.1} value={source.length_m} onChange={(event) => update(space.space_id, { length_m: Math.max(1, Number(event.target.value) || 1) })} /></td>
                        <td><input className="aq-input" type="number" min={1} step={0.1} value={source.width_m} onChange={(event) => update(space.space_id, { width_m: Math.max(1, Number(event.target.value) || 1) })} /></td>
                        <td><input className="aq-input" type="number" min={2} step={0.1} value={source.height_m} onChange={(event) => update(space.space_id, { height_m: Math.max(2, Number(event.target.value) || 2) })} /></td>
                        <td><input className="aq-input" type="number" min={1} step={1} value={source.quantity ?? 1} onChange={(event) => update(space.space_id, { quantity: Math.max(1, Math.round(Number(event.target.value) || 1)) })} /></td>
                        <td className="cell-muted">{Math.round(space.area_m2 * 10) / 10} m²</td>
                        <td className="cell-muted">{space.lighting_points}L · {space.double_sockets}S · {space.switch_positions}Sw</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" style={{ marginTop: 16 }}>
            <div className="panel-head"><h2>Materials</h2></div>
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr><th>Material</th><th>Quantity</th><th>Engineering</th><th>Unit price</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.catalogueId}>
                      <td>{line.catalogueName}</td>
                      <td className="cell-muted">{line.quantity} {line.catalogueUnit}</td>
                      <td className="cell-muted">{line.engineeringQuantity} {line.catalogueUnit === "length" ? "m" : line.catalogueUnit}</td>
                      <td className="cell-muted">{line.unitPrice === null ? "Pending" : money(line.unitPrice)}</td>
                      <td>{line.amount === null ? "—" : money(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="aq-total">
              <span>{priced} of {lines.length} materials priced</span>
              <strong>{money(total)}</strong>
            </div>
          </section>

          <p className="form-note" style={{ marginTop: 14 }}>
            {CONFIDENCE_NOTE} Rule set {RULE_SET}. Quantities update as the spaces change; prices come from the
            catalogue price list.
          </p>
        </main>
      </div>
    </div>
  );
}
