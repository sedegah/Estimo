"use client";

import { useState } from "react";

type Key = "lights" | "sockets" | "boards" | "circuits";

const PRICES: Record<Key, number> = { lights: 180, sockets: 95, boards: 850, circuits: 320 };

const LIGHTS = [
  [70, 80],
  [300, 80],
  [170, 260],
];

const SOCKETS = [
  [40, 62],
  [380, 62],
  [40, 285],
  [400, 285],
];

export function BuilderView() {
  const [counts, setCounts] = useState({ lights: 3, sockets: 3, boards: 1, circuits: 4 });
  const [name, setName] = useState("Family house");
  const [saved, setSaved] = useState(false);

  const total = counts.lights * PRICES.lights + counts.sockets * PRICES.sockets + counts.boards * PRICES.boards + counts.circuits * PRICES.circuits;

  const add = (key: Key) => {
    setCounts((current) => ({ ...current, [key]: current[key] + 1 }));
    setSaved(false);
  };

  return (
    <div className="builder">
      <header className="builder-topbar">
        <strong className="builder-brand">estimo<span>.</span></strong>
        <input className="builder-name" value={name} onChange={(event) => setName(event.target.value)} aria-label="Project name" />
        <button className="builder-save" type="button" onClick={() => setSaved(true)}>{saved ? "Saved" : "Save project"}</button>
      </header>

      <div className="builder-body">
        <aside className="builder-tools">
          <p className="builder-label">Add to plan</p>
          <button className="builder-tool" type="button" onClick={() => add("lights")}><span className="builder-swatch light">✕</span> Light point</button>
          <button className="builder-tool" type="button" onClick={() => add("sockets")}><span className="builder-swatch socket" /> Socket</button>
          <button className="builder-tool" type="button" onClick={() => add("boards")}><span className="builder-swatch board">III</span> Distribution board</button>
          <button className="builder-tool" type="button" onClick={() => add("circuits")}><span className="builder-swatch run" /> Circuit run</button>
        </aside>

        <section className="builder-canvas">
          <svg viewBox="0 0 440 340" className="builder-plan" role="img" aria-label="Floor plan">
            <rect x="10" y="10" width="420" height="320" fill="none" stroke="#fff" strokeWidth="4" />
            <path d="M230 10V120M230 160V330M10 150H150M190 150H430M300 330V240M345 240H430" fill="none" stroke="#fff" strokeWidth="4" />
            <path d="M70 150V260H170M70 150V80M230 120H300V80" fill="none" stroke="#F5B800" strokeWidth="2.4" strokeDasharray="3 7" strokeLinecap="round" />
            {LIGHTS.map(([cx, cy]) => (
              <g key={`l${cx}-${cy}`}>
                <circle cx={cx} cy={cy} r="10" fill="#0B2142" stroke="#F5B800" strokeWidth="2" />
                <path d={`M${cx - 6} ${cy - 6}L${cx + 6} ${cy + 6}M${cx + 6} ${cy - 6}L${cx - 6} ${cy + 6}`} stroke="#F5B800" strokeWidth="2" />
              </g>
            ))}
            {SOCKETS.map(([x, y]) => (
              <rect key={`s${x}-${y}`} x={x} y={y} width="12" height="12" fill="#F5B800" />
            ))}
            <rect x="26" y="182" width="42" height="30" rx="4" fill="#F5B800" />
            <text x="47" y="202" textAnchor="middle" fontSize="11" fontFamily="Arial" fontWeight="700" fill="#0B2142">DB</text>
            <text x="34" y="40" fontSize="11" fontFamily="Arial" fill="#C3CEE2">Living</text>
            <text x="246" y="40" fontSize="11" fontFamily="Arial" fill="#C3CEE2">Bedroom 1</text>
            <text x="34" y="180" fontSize="11" fontFamily="Arial" fill="#C3CEE2">Kitchen</text>
            <text x="246" y="180" fontSize="11" fontFamily="Arial" fill="#C3CEE2">Bedroom 2</text>
            <text x="356" y="230" fontSize="11" fontFamily="Arial" fill="#C3CEE2">Bath</text>
          </svg>
        </section>

        <aside className="builder-summary">
          <h2>Your estimate</h2>
          <dl>
            <div><dt>Light points</dt><dd>{counts.lights}</dd></div>
            <div><dt>Sockets</dt><dd>{counts.sockets}</dd></div>
            <div><dt>Distribution board</dt><dd>{counts.boards}</dd></div>
            <div><dt>Circuit runs</dt><dd>{counts.circuits * 6} m</dd></div>
          </dl>
          <div className="builder-total">
            <span>First estimate</span>
            <strong>GHS {total.toLocaleString("en-GH")}</strong>
          </div>
          <button className="builder-download" type="button">Download estimate</button>
        </aside>
      </div>
    </div>
  );
}
