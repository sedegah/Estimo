"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { saveTemplate } from "@/lib/api";

type Tool = "light" | "socket" | "board" | "run" | "erase";

type Placed = { id: string; type: Exclude<Tool, "erase">; x: number; y: number };

const RATES = { light: 180, socket: 95, board: 850, run: 320 } as const;

const LABELS: Record<Tool, string> = {
  light: "Light point",
  socket: "Socket",
  board: "Distribution board",
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
export function BuilderView() {
  const [tool, setTool] = useState<Tool>("light");
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
    if (!at) return;

    if (dragId) return;
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
    setPlaced((current) => [...current, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type: tool, ...at }]);
    setSaved(false);
  };

  const remove = (id: string) => {
    setPlaced((current) => current.filter((item) => item.id !== id));
    setSaved(false);
  };

  return (
    <div className="eb">
      <nav className="eb-nav">
        <Link className="eb-logo" href="/" aria-label="Back to dashboard">estimo<span>.</span></Link>

        <div className="eb-nav-center">
          <select className="eb-preset" value={preset} onChange={(event) => { setPreset(event.target.value); setPlaced(buildPreset(event.target.value)); setSaved(false); }} aria-label="Project template">
            {PRESETS.map((entry) => (<option key={entry.code} value={entry.code}>{entry.label}</option>))}
          </select>
        </div>
        <button className="eb-save" type="button" disabled={saving} onClick={async () => {
          setSaving(true);
          const label = LABELS[tool === "erase" ? "light" : tool];
          void label;
          const result = await saveTemplate({ name: `${preset} plan`, preset, plan: placed, totals: { counts, total } });
          setSaving(false);
          setSaved(result.ok);
          setNote(result.ok ? "Saved" : result.error ?? "Could not save");
        }}>{saving ? "Saving..." : saved ? "Saved" : "Save project"}</button>
      </nav>

      <div className="eb-body">
        <aside className="eb-tools">
          <p className="eb-tools-label">Add to plan</p>
          {(["light", "socket", "board", "run"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={tool === value ? "eb-tool is-active" : "eb-tool"}
              onClick={() => setTool(value)}
            >
              {value === "light" ? (
                <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true"><g fill="none" stroke="#C48F00" strokeWidth="2" strokeLinecap="round"><circle cx="10" cy="10" r="8" /><path d="M5 5L15 15M15 5L5 15" /></g></svg>
              ) : null}
              {value === "socket" ? (
                <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" fill="#F5B800" stroke="#0B2142" strokeWidth="1.5" /></svg>
              ) : null}
              {value === "board" ? (
                <svg width="26" height="20" viewBox="0 0 64 44" aria-hidden="true"><rect x="2" y="2" width="60" height="40" rx="5" fill="#0B2142" stroke="#F5B800" strokeWidth="4" /><path d="M16 14V30M28 14V30M40 14V30M52 14V30" stroke="#F5B800" strokeWidth="6" /></svg>
              ) : null}
              {value === "run" ? (
                <svg width="26" height="6" viewBox="0 0 24 6" aria-hidden="true"><path d="M1 3H23" stroke="#C48F00" strokeWidth="3" strokeDasharray="3 6" strokeLinecap="round" /></svg>
              ) : null}
              {LABELS[value]}
            </button>
          ))}
          <button type="button" className={tool === "erase" ? "eb-tool is-active" : "eb-tool"} onClick={() => setTool("erase")}>
            Erase
          </button>
          <p className="eb-hint">Pick a tool, then tap the plan to place it. With Erase on, tap a placed item to remove it.</p>
        </aside>

        <section className="eb-canvas">
          <svg
            ref={svgRef}
            viewBox="0 0 620 430"
            role="img"
            aria-label="Editable floor plan"
            className="eb-plan"
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
                <rect x={room.x} y={room.y} width={room.w} height={room.h} fill="none" stroke="#fff" strokeWidth="7" />
                <text x={room.x + 26} y={room.y + 34} fontSize="14" fill="#C3CEE2">{room.label}</text>
              </g>
            ))}

            {placed.map((item) => {
              if (item.type === "light") {
                return (
                  <g key={item.id} onPointerDown={(event) => { event.stopPropagation(); if (tool === "erase") { remove(item.id); return; } setDragId(item.id); (event.currentTarget as Element).setPointerCapture?.(event.pointerId); }}>
                    <circle cx={item.x} cy={item.y} r="11" fill="#0B2142" stroke="#F5B800" strokeWidth="2.5" />
                    <path d={`M${item.x - 6} ${item.y - 6}L${item.x + 6} ${item.y + 6}M${item.x + 6} ${item.y - 6}L${item.x - 6} ${item.y + 6}`} stroke="#F5B800" strokeWidth="2.2" />
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
                    fill="#F5B800"
                    stroke="#0B2142"
                    strokeWidth="2"
                    onPointerDown={(event) => { event.stopPropagation(); if (tool === "erase") { remove(item.id); return; } setDragId(item.id); (event.currentTarget as Element).setPointerCapture?.(event.pointerId); }}
                  />
                );
              }
              if (item.type === "board") {
                return (
                  <g key={item.id} onPointerDown={(event) => { event.stopPropagation(); if (tool === "erase") { remove(item.id); return; } setDragId(item.id); (event.currentTarget as Element).setPointerCapture?.(event.pointerId); }}>
                    <rect x={item.x - 20} y={item.y - 14} width="40" height="28" rx="4" fill="#F5B800" stroke="#0B2142" strokeWidth="2" />
                    <text x={item.x} y={item.y + 4} textAnchor="middle" fontSize="11" fontFamily="Arial" fontWeight="700" fill="#0B2142">DB</text>
                  </g>
                );
              }
              return (
                <path
                  key={item.id}
                  d={`M${item.x - 26} ${item.y}H${item.x + 26}`}
                  stroke="#F5B800"
                  strokeWidth="3"
                  strokeDasharray="3 8"
                  strokeLinecap="round"
                  onPointerDown={(event) => { event.stopPropagation(); if (tool === "erase") { remove(item.id); return; } setDragId(item.id); (event.currentTarget as Element).setPointerCapture?.(event.pointerId); }}
                />
              );
            })}
          </svg>
        </section>

        <aside className="eb-summary">
          <h1>Your estimate</h1>
          <ul>
            <li><span>Light points</span><span>{counts.light}</span></li>
            <li><span>Sockets</span><span>{counts.socket}</span></li>
            <li><span>Distribution board</span><span>{counts.board}</span></li>
            <li><span>Circuit runs</span><span>{counts.run * 6} m</span></li>
          </ul>
          <p className="eb-first">First estimate</p>
          <p className="eb-total">GHS {total.toLocaleString("en-GH")}</p>
          <button className="eb-download" type="button" onClick={async () => {
            const response = await fetch("/api/estimate-pdf", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: preset, preset, plan: placed, rates: RATES }),
            });
            if (!response.ok) { setNote("Could not build the PDF"); return; }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "estimo-estimate.pdf";
            link.click();
            URL.revokeObjectURL(url);
          }}>Download estimate</button>
          {note ? <p className="eb-note">{note}</p> : null}
        </aside>
      </div>
    </div>
  );
}
