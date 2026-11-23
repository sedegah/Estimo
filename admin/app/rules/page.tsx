"use client";

import { useMemo, useState } from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import { ConsoleRail } from "../../components/console-rail";
import { LoadingScreen } from "../loading-screen";
import { calculate, getTemplateSpaces, listTemplates, PROJECT_TYPES } from "@/lib/quantity-engine";
import type { SpecLevel } from "@/lib/quantity-engine/types";
import roomRules from "@/lib/data/quantity-engine/room_rules.json";
import globalParameters from "@/lib/data/quantity-engine/global_parameters.json";
import circuitRules from "@/lib/data/quantity-engine/circuit_rules.json";
import specialLoads from "@/lib/data/quantity-engine/special_loads.json";

type Tab = "rooms" | "parameters" | "circuits" | "loads";

const roomRows = roomRules as unknown as {
  room_type: string;
  spec_level: string;
  lighting_area_per_point_m2: number | null;
  minimum_lighting_points: number;
  socket_spacing_perimeter_m: number | null;
  minimum_double_sockets: number;
  fan_points_default: number;
  ac_default: string;
  tv_points_default: number;
  data_points_default: number;
}[];

const parameterRows = globalParameters as unknown as { key: string; value: number; unit: string; description: string }[];
const circuitRows = circuitRules as unknown as { circuit_type: string; project_context: string; limit_value: number; limit_basis: string }[];
const loadRows = specialLoads as unknown as {
  load_key: string;
  space_context: string;
  selection_mode: string;
  default_enabled: boolean;
  circuit_policy: string;
}[];

const RULE_SET = "ESTIMO-GH-QTY-v1.0";
const specs: SpecLevel[] = ["economy", "standard", "premium"];

export default function AdminRulesPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [tab, setTab] = useState<Tab>("rooms");
  const [projectType, setProjectType] = useState("two_bedroom");
  const [spec, setSpec] = useState<SpecLevel>("standard");

  const templates = useMemo(() => listTemplates(), []);
  const template = templates.find((row) => row.projectType === projectType) ?? templates[0];

  const preview = useMemo(() => {
    const spaces = getTemplateSpaces(template.id);
    return calculate({ templateId: template.id, specLevel: spec, spaces, projectType: template.projectType });
  }, [template, spec]);

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) {
    return (
      <div className="auth-wrap">
        <SignIn routing="hash" />
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/brand/estimo-logo-horizontal-dark.png" alt="ESTIMO" />
          <span className="brand-role">admin</span>
        </div>
        <div className="topbar-right">
          <a className="btn btn-outline-light btn-sm" href="/">Back to console</a>
        </div>
      </header>

      <div className="body">
        <ConsoleRail active="Rules" />
        <main className="main">
          <div className="head">
            <div>
              <h1>Rules</h1>
              <p>Rule set {RULE_SET} — read only for now; each change to these numbers moves every future estimate.</p>
            </div>
          </div>

          <div className="toolbar">
            <div className="aq-specs">
              {(["rooms", "parameters", "circuits", "loads"] as Tab[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={tab === value ? "is-active" : ""}
                  onClick={() => setTab(value)}
                >
                  {value === "rooms" ? "Room rules" : value === "parameters" ? "Parameters" : value === "circuits" ? "Circuit limits" : "Special loads"}
                </button>
              ))}
            </div>
          </div>

          {/* Preview: what the current numbers produce for one template */}
          <section className="panel" style={{ marginTop: 16 }}>
            <div className="panel-head"><h2>Preview</h2></div>
            <div className="panel-body">
              <div className="aq-controls">
                <label className="aq-field">
                  <span>Project</span>
                  <select value={projectType} onChange={(event) => setProjectType(event.target.value)}>
                    {PROJECT_TYPES.map((type) => (
                      <option key={type.key} value={type.key}>{type.label}</option>
                    ))}
                  </select>
                </label>
                <label className="aq-field">
                  <span>Template</span>
                  <select value={template.id} disabled>
                    <option>{template.name}</option>
                  </select>
                </label>
                <div className="aq-specs">
                  {specs.map((value) => (
                    <button key={value} type="button" className={spec === value ? "is-active" : ""} onClick={() => setSpec(value)}>
                      {value[0].toUpperCase() + value.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="aq-summary" style={{ marginTop: 14 }}>
                <div><span>Floor area</span><strong>{preview.totals.floor_area_m2} m²</strong></div>
                <div><span>Light points</span><strong>{preview.totals.lighting_points}</strong></div>
                <div><span>Double sockets</span><strong>{preview.totals.double_sockets}</strong></div>
                <div><span>Fans</span><strong>{preview.totals.fan_points}</strong></div>
                <div><span>Circuits</span><strong>{preview.totals.total_final_circuits}</strong></div>
                <div><span>Board</span><strong>{preview.totals.recommended_db_ways ?? "engineered"} way</strong></div>
                <div><span>Containment</span><strong>{preview.totals.total_containment_m} m</strong></div>
                <div><span>Spaces</span><strong>{preview.spaces.length}</strong></div>
              </div>
              <p className="cell-muted" style={{ marginBottom: 0 }}>
                This preview recalculates from the shipped rule files. Editing and version activation come next.
              </p>
            </div>
          </section>

          <section className="panel" style={{ marginTop: 16 }}>
            <div className="panel-head"><h2>{tab === "rooms" ? "Room rules" : tab === "parameters" ? "Global parameters" : tab === "circuits" ? "Circuit limits" : "Special loads"}</h2></div>
            <div style={{ overflowX: "auto" }}>
              {tab === "rooms" ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Room</th><th>Spec</th><th>m² / point</th><th>Min lights</th><th>Sockets / m</th>
                      <th>Min sockets</th><th>Fans</th><th>AC</th><th>TV</th><th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomRows.map((row) => (
                      <tr key={`${row.room_type}-${row.spec_level}`}>
                        <td>{row.room_type.replace(/_/g, " ")}</td>
                        <td className="cell-muted">{row.spec_level}</td>
                        <td className="cell-muted">{row.lighting_area_per_point_m2 ?? "length / 4"}</td>
                        <td className="cell-muted">{row.minimum_lighting_points}</td>
                        <td className="cell-muted">{row.socket_spacing_perimeter_m ?? "—"}</td>
                        <td className="cell-muted">{row.minimum_double_sockets}</td>
                        <td className="cell-muted">{row.fan_points_default}</td>
                        <td className="cell-muted">{row.ac_default}</td>
                        <td className="cell-muted">{row.tv_points_default}</td>
                        <td className="cell-muted">{row.data_points_default}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : tab === "parameters" ? (
                <table className="table">
                  <thead><tr><th>Key</th><th>Value</th><th>Unit</th><th>Description</th></tr></thead>
                  <tbody>
                    {parameterRows.map((row) => (
                      <tr key={row.key}>
                        <td>{row.key}</td>
                        <td>{row.value}</td>
                        <td className="cell-muted">{row.unit}</td>
                        <td className="cell-muted">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : tab === "circuits" ? (
                <table className="table">
                  <thead><tr><th>Circuit</th><th>Context</th><th>Limit</th><th>Basis</th></tr></thead>
                  <tbody>
                    {circuitRows.map((row) => (
                      <tr key={`${row.circuit_type}-${row.project_context}`}>
                        <td>{row.circuit_type.replace(/_/g, " ")}</td>
                        <td className="cell-muted">{row.project_context}</td>
                        <td>{row.limit_value}</td>
                        <td className="cell-muted">{row.limit_basis.replace(/_/g, " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="table">
                  <thead><tr><th>Load</th><th>Context</th><th>Selection</th><th>Default</th><th>Circuit policy</th></tr></thead>
                  <tbody>
                    {loadRows.map((row) => (
                      <tr key={row.load_key}>
                        <td>{row.load_key.replace(/_/g, " ")}</td>
                        <td className="cell-muted">{row.space_context.replace(/_/g, " ")}</td>
                        <td className="cell-muted">{row.selection_mode.replace(/_/g, " ")}</td>
                        <td className="cell-muted">{row.default_enabled ? "on" : "off"}</td>
                        <td className="cell-muted">{row.circuit_policy.replace(/_/g, " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
