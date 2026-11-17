"use client";

import { useRef, useState } from "react";

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

export function BuilderView() {
  const [tool, setTool] = useState<Tool>("light");
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [project, setProject] = useState("Family house");
  const [saved, setSaved] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const counts = {
    light: placed.filter((item) => item.type === "light").length,
    socket: placed.filter((item) => item.type === "socket").length,
    board: placed.filter((item) => item.type === "board").length,
    run: placed.filter((item) => item.type === "run").length,
  };

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
    if (tool === "erase") return;
    const at = point(event);
    if (!at) return;
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
        <span className="eb-logo">estimo<span>.</span></span>
        <input className="eb-title" value={project} onChange={(event) => setProject(event.target.value)} aria-label="Project name" />
        <button className="eb-save" type="button" onClick={() => setSaved(true)}>{saved ? "Saved" : "Save project"}</button>
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
          >
            <g fill="none" stroke="#fff" strokeWidth="7">
              <rect x="20" y="20" width="580" height="390" />
              <path d="M340 20V150M340 200V410M20 210H190M240 210H600M520 210V300M520 345V410" />
            </g>
            <path d="M60 210V320H185M185 210V130H170" fill="none" stroke="#F5B800" strokeWidth="3" strokeDasharray="3 8" strokeLinecap="round" />
            <g fontSize="14" fill="#C3CEE2">
              <text x="60" y="60">Living</text>
              <text x="400" y="60">Bedroom 1</text>
              <text x="60" y="250">Kitchen</text>
              <text x="380" y="250">Bedroom 2</text>
              <text x="535" y="250">Bath</text>
            </g>

            {placed.map((item) => {
              if (item.type === "light") {
                return (
                  <g key={item.id} onPointerDown={(event) => { event.stopPropagation(); if (tool === "erase") remove(item.id); }}>
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
                    onPointerDown={(event) => { event.stopPropagation(); if (tool === "erase") remove(item.id); }}
                  />
                );
              }
              if (item.type === "board") {
                return (
                  <g key={item.id} onPointerDown={(event) => { event.stopPropagation(); if (tool === "erase") remove(item.id); }}>
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
                  onPointerDown={(event) => { event.stopPropagation(); if (tool === "erase") remove(item.id); }}
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
          <button className="eb-download" type="button">Download estimate</button>
        </aside>
      </div>
    </div>
  );
}
