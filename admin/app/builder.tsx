"use client";

import { useMemo, useState } from "react";

type Key = "lights" | "sockets" | "boards" | "circuits";

const RATES: Record<Key, number> = { lights: 180, sockets: 95, boards: 850, circuits: 320 };

export function BuilderView() {
  const [counts, setCounts] = useState({ lights: 3, sockets: 3, boards: 1, circuits: 4 });
  const [project, setProject] = useState("Family house");
  const [saved, setSaved] = useState(false);

  const total = useMemo(
    () => counts.lights * RATES.lights + counts.sockets * RATES.sockets + counts.boards * RATES.boards + counts.circuits * RATES.circuits,
    [counts],
  );

  const add = (key: Key) => {
    setCounts((current) => ({ ...current, [key]: current[key] + 1 }));
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
          <button className="eb-tool" type="button" onClick={() => add("lights")}>
            <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true"><g fill="none" stroke="#C48F00" strokeWidth="2" strokeLinecap="round"><circle cx="10" cy="10" r="8" /><path d="M5 5L15 15M15 5L5 15" /></g></svg>
            Light point
          </button>
          <button className="eb-tool" type="button" onClick={() => add("sockets")}>
            <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" fill="#F5B800" stroke="#0B2142" strokeWidth="1.5" /></svg>
            Socket
          </button>
          <button className="eb-tool" type="button" onClick={() => add("boards")}>
            <svg width="26" height="20" viewBox="0 0 64 44" aria-hidden="true"><rect x="2" y="2" width="60" height="40" rx="5" fill="#0B2142" stroke="#F5B800" strokeWidth="4" /><path d="M16 14V30M28 14V30M40 14V30M52 14V30" stroke="#F5B800" strokeWidth="6" /></svg>
            Distribution board
          </button>
          <button className="eb-tool" type="button" onClick={() => add("circuits")}>
            <svg width="26" height="6" viewBox="0 0 24 6" aria-hidden="true"><path d="M1 3H23" stroke="#C48F00" strokeWidth="3" strokeDasharray="3 6" strokeLinecap="round" /></svg>
            Circuit run
          </button>
        </aside>

        <section className="eb-canvas">
          <svg viewBox="0 0 620 430" role="img" aria-label="Editable floor plan" className="eb-plan">
            <g fill="none" stroke="#fff" strokeWidth="7">
              <rect x="20" y="20" width="580" height="390" />
              <path d="M340 20V150M340 200V410M20 210H190M240 210H600M520 210V300M520 345V410" />
            </g>
            <path d="M60 210V320H185M185 210V130H170" fill="none" stroke="#F5B800" strokeWidth="3" strokeDasharray="3 8" strokeLinecap="round" />
            <g fill="#0B2142" stroke="#F5B800" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="170" cy="130" r="12" />
              <circle cx="470" cy="110" r="12" />
              <circle cx="185" cy="320" r="12" />
              <path d="M164 124L176 136M176 124L164 136M464 104L476 116M476 104L464 116M179 314L191 326M191 314L179 326" />
            </g>
            <g fill="#F5B800" stroke="#0B2142" strokeWidth="2">
              <rect x="30" y="90" width="14" height="14" />
              <rect x="560" y="120" width="14" height="14" />
              <rect x="330" y="394" width="14" height="14" />
            </g>
            <g fontSize="14" fill="#C3CEE2">
              <text x="60" y="60">Living</text>
              <text x="400" y="60">Bedroom 1</text>
              <text x="60" y="250">Kitchen</text>
              <text x="380" y="250">Bedroom 2</text>
              <text x="535" y="250">Bath</text>
            </g>
          </svg>
        </section>

        <aside className="eb-summary">
          <h1>Your estimate</h1>
          <ul>
            <li><span>Light points</span><span>{counts.lights}</span></li>
            <li><span>Sockets</span><span>{counts.sockets}</span></li>
            <li><span>Distribution board</span><span>{counts.boards}</span></li>
            <li><span>Circuit runs</span><span>{counts.circuits * 6} m</span></li>
          </ul>
          <p className="eb-first">First estimate</p>
          <p className="eb-total">GHS {total.toLocaleString("en-GH")}</p>
          <button className="eb-download" type="button">Download estimate</button>
        </aside>
      </div>
    </div>
  );
}
