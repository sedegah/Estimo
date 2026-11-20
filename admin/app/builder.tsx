"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { saveTemplate } from "@/lib/api";

type Tool = "light" | "socket" | "board" | "run" | "erase";

type Placed = { id: string; type: Exclude<Tool, "erase">; x: number; y: number; axis?: "h" | "v" };

const RATES = { light: 180, socket: 95, board: 850, run: 320 } as const;

const TOOL_LABELS: Record<Tool, string> = {
  light: "Light point",
  socket: "Socket",
  board: "Board",
  run: "Circuit run",
  erase: "Erase",
};

const PRESETS = [
  { code: "HOME-1R", label: "Single room", lights: 2, sockets: 2, boards: 1 },
  { code: "HOME-1B", label: "1-bedroom home", lights: 3, sockets: 3, boards: 1 },
  { code: "HOME-2B", label: "2-bedroom home", lights: 5, sockets: 5, boards: 1 },
  { code: "HOME-3B", label: "3-bedroom home", lights: 7, sockets: 7, boards: 1 },
  { code: "HOME-4B", label: "4-bedroom home", lights: 9, sockets: 9, boards: 2 },
  { code: "SHOP-KIOSK", label: "Container kiosk", lights: 2, sockets: 3, boards: 1 },
  { code: "SHOP-RETAIL", label: "Retail shop", lights: 6, sockets: 6, boards: 1 },
  { code: "COMM-OFF-S", label: "Small office", lights: 6, sockets: 8, boards: 1 },
  { code: "IND-WORK", label: "Workshop", lights: 4, sockets: 4, boards: 2 },
] as const;

const roomGrid = (cols: number, rows: number, labels: string[]) => {
  const left = 20;
  const top = 20;
  const width = 580;
  const height = 390;
  const cellW = width / cols;
  const cellH = height / rows;
  return labels.map((label, index) => ({
    label,
    x: left + (index % cols) * cellW,
    y: top + Math.floor(index / cols) * cellH,
    w: cellW,
    h: cellH,
  }));
};

const ROOMS: Record<string, ReturnType<typeof roomGrid>> = {
  "HOME-1R": roomGrid(1, 1, ["Room"]),
  "HOME-1B": roomGrid(2, 1, ["Living", "Bedroom"]),
  "HOME-2B": roomGrid(2, 2, ["Living", "Bedroom 1", "Kitchen", "Bedroom 2"]),
  "HOME-3B": roomGrid(3, 2, ["Living", "Bedroom 1", "Bedroom 2", "Kitchen", "Bedroom 3", "Bath"]),
  "HOME-4B": roomGrid(4, 2, ["Living", "Bedroom 1", "Bedroom 2", "Bedroom 3", "Kitchen", "Bath", "Bedroom 4", "Store"]),
  "SHOP-KIOSK": roomGrid(1, 1, ["Kiosk"]),
  "SHOP-RETAIL": roomGrid(2, 1, ["Shop floor", "Store"]),
  "COMM-OFF-S": roomGrid(3, 1, ["Open office", "Meeting", "Lobby"]),
  "IND-WORK": roomGrid(2, 1, ["Workshop", "Store"]),
};

const buildPreset = (code: string): Placed[] => {
  const preset = PRESETS.find((entry) => entry.code === code) ?? PRESETS[2];
  const lights = Array.from({ length: preset.lights }, (_, index) => ({
    id: `l-${index}`,
    type: "light" as const,
    x: 100 + (index % 4) * 125,
    y: 120 + Math.floor(index / 4) * 120,
  }));
  const sockets = Array.from({ length: preset.sockets }, (_, index) => ({
    id: `s-${index}`,
    type: "socket" as const,
    x: 60 + (index % 5) * 110,
    y: index % 2 === 0 ? 42 : 400,
  }));
  const boards = Array.from({ length: preset.boards }, (_, index) => ({
    id: `b-${index}`,
    type: "board" as const,
    x: 62,
    y: 230 + index * 70,
  }));
  return [...lights, ...sockets, ...boards];
};

const money = (value: number) =>
  `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ToolIcon({ tool }: { tool: Tool }) {
  if (tool === "light") {
    return (
      <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" />
      </svg>
    );
  }
  if (tool === "socket") {
    return (
      <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="14" height="14" rx="2.5" />
        <path d="M8 7v2M12 7v2M7 12h6" strokeLinecap="round" />
      </svg>
    );
  }
  if (tool === "board") {
    return (
      <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="4" width="14" height="12" rx="2" />
        <path d="M7 7v6M10 7v6M13 7v6" strokeLinecap="round" />
      </svg>
    );
  }
  if (tool === "run") {
    return (
      <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M3 10h14" strokeDasharray="2 4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 14 14 4M7 4h7v7" />
    </svg>
  );
}

export function BuilderView() {
  const [tool, setTool] = useState<Tool>("light");
  const [runAxis, setRunAxis] = useState<"h" | "v">("h");
  const [placed, setPlaced] = useState<Placed[]>(() => buildPreset("HOME-2B"));
  const [preset, setPreset] = useState<string>("HOME-2B");
  const [dragId, setDragId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const svgRef = useRef<SVGSVGElement | null>(null);

  const counts = {
    light: placed.filter((item) => item.type === "light").length,
    socket: placed.filter((item) => item.type === "socket").length,
    board: placed.filter((item) => item.type === "board").length,
    run: placed.filter((item) => item.type === "run").length,
  };

  const rooms = ROOMS[preset] ?? ROOMS["HOME-2B"];
  const total = counts.light * RATES.light + counts.socket * RATES.socket + counts.board * RATES.board + counts.run * RATES.run;

  const point = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const box = svg.getBoundingClientRect();
    return {
      x: Math.round(((event.clientX - box.left) / box.width) * 620),
      y: Math.round(((event.clientY - box.top) / box.height) * 430),
    };
  };

  const place = (event: React.PointerEvent<SVGSVGElement>) => {
    const at = point(event);
    if (!at || dragId) return;

    if (tool === "erase") {
      setPlaced((current) => {
        let nearestId: string | null = null;
        let nearest = 30;
        for (const item of current) {
          const distance = Math.hypot(item.x - at.x, item.y - at.y);
          if (distance < nearest) {
            nearest = distance;
            nearestId = item.id;
          }
        }
        return nearestId ? current.filter((item) => item.id !== nearestId) : current;
      });
      setSaved(false);
      return;
    }

    setPlaced((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type: tool, ...at, ...(tool === "run" ? { axis: runAxis } : {}) },
    ]);
    setSaved(false);
  };

  const remove = (id: string) => {
    setPlaced((current) => current.filter((item) => item.id !== id));
    setSaved(false);
  };

  const dragHandlers = (id: string) => ({
    onPointerDown: (event: React.PointerEvent) => {
      event.stopPropagation();
      if (tool === "erase") {
        remove(id);
        return;
      }
      setDragId(id);
      (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    },
  });

  const save = async () => {
    setSaving(true);
    const result = await saveTemplate({ name: `${preset} plan`, preset, plan: placed, totals: { counts, total } });
    setSaving(false);
    setSaved(result.ok);
    setNote(result.ok ? "Saved" : result.error ?? "Could not save");
  };

  const download = async () => {
    const response = await fetch("/api/estimate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: preset, preset, plan: placed, rates: RATES }),
    });
    if (!response.ok) {
      setNote("Could not build the PDF");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "estimo-estimate.pdf";
    link.click();
    URL.revokeObjectURL(url);
  };

  const activePreset = PRESETS.find((entry) => entry.code === preset) ?? PRESETS[2];

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
          <span className="rail-item is-active">Estimate builder</span>
          <Link className="rail-item" href="/?tab=settings">Settings</Link>
        </aside>

        <main className="main">
          <header className="head">
            <div>
              <h1>Estimate builder</h1>
              <p>Lay out the points for a project, then save it as a template or download the priced estimate.</p>
            </div>
            <div className="head-actions">
              <select
                className="builder-preset"
                value={preset}
                onChange={(event) => {
                  setPreset(event.target.value);
                  setPlaced(buildPreset(event.target.value));
                  setSaved(false);
                  setNote("");
                }}
                aria-label="Project template"
              >
                {PRESETS.map((entry) => (
                  <option key={entry.code} value={entry.code}>{entry.label}</option>
                ))}
              </select>
              <button className="btn" type="button" disabled={saving} onClick={() => void save()}>
                {saving ? "Saving…" : saved ? "Saved" : "Save template"}
              </button>
              <button className="btn btn-amber" type="button" onClick={() => void download()}>Download estimate</button>
            </div>
          </header>

          {note ? <p className="banner banner-ok">{note}</p> : null}

          <div className="builder">
            <section className="panel builder-tools">
              <div className="panel-head"><h2>Add to plan</h2></div>
              <div className="panel-body builder-tool-list">
                {(["light", "socket", "board", "run"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={tool === value ? "tool-btn is-active" : "tool-btn"}
                    onClick={() => setTool(value)}
                  >
                    <ToolIcon tool={value} />
                    {TOOL_LABELS[value]}
                  </button>
                ))}

                {tool === "run" ? (
                  <div className="builder-axis">
                    <button type="button" className={runAxis === "h" ? "is-active" : ""} onClick={() => setRunAxis("h")}>Horizontal</button>
                    <button type="button" className={runAxis === "v" ? "is-active" : ""} onClick={() => setRunAxis("v")}>Vertical</button>
                  </div>
                ) : null}

                <button type="button" className={tool === "erase" ? "tool-btn is-active" : "tool-btn"} onClick={() => setTool("erase")}>
                  <ToolIcon tool="erase" />
                  Erase
                </button>

                <p className="builder-hint">
                  Pick a tool, then click the plan to place it. Drag any marker to move it; with Erase on, click a marker to remove it.
                </p>
              </div>
            </section>

            <section className="panel builder-canvas">
              <div className="builder-canvas-head">
                <div>
                  <strong>{activePreset.label}</strong>
                  <span>{rooms.length} space{rooms.length === 1 ? "" : "s"}</span>
                </div>
                <span className="builder-count">{placed.length} items placed</span>
              </div>
              <svg
                ref={svgRef}
                viewBox="0 0 620 430"
                role="img"
                aria-label="Editable floor plan"
                className="builder-plan"
                onPointerDown={place}
                onPointerMove={(event) => {
                  if (!dragId) return;
                  const at = point(event);
                  if (!at) return;
                  setPlaced((current) => current.map((item) => (item.id === dragId ? { ...item, x: at.x, y: at.y } : item)));
                  setSaved(false);
                }}
                onPointerUp={() => setDragId(null)}
                onPointerLeave={() => setDragId(null)}
              >
                {rooms.map((room) => (
                  <g key={room.label}>
                    <rect x={room.x} y={room.y} width={room.w} height={room.h} fill="none" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" />
                    <text x={room.x + 24} y={room.y + room.h - 16} fontSize="14" fill="#9fb0cc">{room.label}</text>
                  </g>
                ))}

                {placed.map((item) => {
                  if (item.type === "light") {
                    return (
                      <g key={item.id} {...dragHandlers(item.id)}>
                        <circle cx={item.x} cy={item.y} r="11" fill="#0b1f3f" stroke="#f5b301" strokeWidth="2.5" />
                        <path d={`M${item.x - 6} ${item.y - 6}L${item.x + 6} ${item.y + 6}M${item.x + 6} ${item.y - 6}L${item.x - 6} ${item.y + 6}`} stroke="#f5b301" strokeWidth="2.2" />
                      </g>
                    );
                  }
                  if (item.type === "socket") {
                    return (
                      <rect
                        key={item.id}
                        x={item.x - 7}
                        y={item.y - 7}
                        width="14"
                        height="14"
                        fill="#f5b301"
                        stroke="#0b1f3f"
                        strokeWidth="2"
                        {...dragHandlers(item.id)}
                      />
                    );
                  }
                  if (item.type === "board") {
                    return (
                      <g key={item.id} {...dragHandlers(item.id)}>
                        <rect x={item.x - 20} y={item.y - 14} width="40" height="28" rx="4" fill="#f5b301" stroke="#0b1f3f" strokeWidth="2" />
                        <text x={item.x} y={item.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0b1f3f">DB</text>
                      </g>
                    );
                  }
                  const runPath = item.axis === "v" ? `M${item.x} ${item.y - 26}V${item.y + 26}` : `M${item.x - 26} ${item.y}H${item.x + 26}`;
                  return (
                    <path
                      key={item.id}
                      d={runPath}
                      stroke="#f5b301"
                      strokeWidth="3"
                      strokeDasharray="3 8"
                      strokeLinecap="round"
                      {...dragHandlers(item.id)}
                    />
                  );
                })}
              </svg>
            </section>

            <section className="panel builder-summary">
              <div className="panel-head"><h2>Your estimate</h2></div>
              <div className="panel-body">
                <ul className="summary-list">
                  <li><span>Light points</span><b>{counts.light}</b></li>
                  <li><span>Sockets</span><b>{counts.socket}</b></li>
                  <li><span>Distribution boards</span><b>{counts.board}</b></li>
                  <li><span>Circuit runs</span><b>{counts.run * 6} m</b></li>
                </ul>

                <div className="summary-rates">
                  {(["light", "socket", "board", "run"] as const).map((key) => (
                    <div key={key}>
                      <span>{TOOL_LABELS[key]}</span>
                      <small>{money(RATES[key])}</small>
                    </div>
                  ))}
                </div>

                <div className="summary-total">
                  <span>First estimate</span>
                  <strong>{money(total)}</strong>
                </div>

                <p className="form-note">Rates are the planning defaults; the estimate PDF lists every point and run.</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
