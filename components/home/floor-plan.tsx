const LIGHTS: [number, number][] = [
  [170, 130],
  [470, 110],
  [185, 320],
  [445, 320],
  [560, 330],
];

/* One run per load, each starting at the distribution board so current always flows outwards. */
const CIRCUIT_RUNS: { path: string; duration: string; pulseDelay: string }[] = [
  { path: "M60 210V320H185", duration: "2.8s", pulseDelay: "0s" },
  { path: "M185 210V130H170", duration: "1.1s", pulseDelay: ".9s" },
  { path: "M340 150H470V110", duration: "2s", pulseDelay: "1.8s" },
];

export function FloorPlan() {
  return (
    <svg
      className="home-plan-svg"
      viewBox="0 0 620 430"
      role="img"
      aria-label="Floor plan with lit rooms, sockets and live circuit runs from the distribution board"
    >
      <defs>
        <radialGradient id="plan-glow">
          <stop offset="0" stopColor="#F5B800" stopOpacity=".55" />
          <stop offset="1" stopColor="#F5B800" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="plan-pulse-halo">
          <stop offset="0" stopColor="#FFD75E" stopOpacity=".9" />
          <stop offset=".45" stopColor="#FFD75E" stopOpacity=".35" />
          <stop offset="1" stopColor="#FFD75E" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle className="plan-orb" cx="170" cy="130" r="150" fill="url(#plan-glow)" />
      <circle className="plan-orb" cx="470" cy="110" r="120" fill="url(#plan-glow)" />
      <circle className="plan-orb" cx="185" cy="320" r="130" fill="url(#plan-glow)" />
      <circle className="plan-orb" cx="445" cy="320" r="90" fill="url(#plan-glow)" />
      <circle className="plan-orb" cx="560" cy="320" r="70" fill="url(#plan-glow)" />

      <g fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="square">
        <rect x="20" y="20" width="580" height="390" />
        <path d="M340 20V150M340 200V410M20 210H190M240 210H600M520 210V300M520 345V410" />
      </g>

      <g fill="none" stroke="#F5B800" strokeLinecap="round" strokeDasharray="3 8">
        <path className="plan-run-halo" d={CIRCUIT_RUNS.map((run) => run.path).join("")} strokeWidth="9" opacity=".16" />
        <path className="plan-run" d={CIRCUIT_RUNS.map((run) => run.path).join("")} strokeWidth="3" />
      </g>

      <g stroke="#F5B800" strokeWidth="2.4" fill="none">
        {LIGHTS.map(([cx, cy]) => (
          <g key={`light-${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="9" />
            <path
              d={`M${cx - 5.4} ${cy - 5.4}L${cx + 5.4} ${cy + 5.4}M${cx + 5.4} ${cy - 5.4}L${cx - 5.4} ${cy + 5.4}`}
            />
          </g>
        ))}
      </g>

      <g fill="#F5B800" stroke="#0B2142" strokeWidth="2">
        <rect x="30" y="90" width="14" height="14" />
        <rect x="250" y="12" width="14" height="14" />
        <rect x="560" y="120" width="14" height="14" />
        <rect x="30" y="250" width="14" height="14" />
        <rect x="30" y="360" width="14" height="14" />
        <rect x="590" y="360" width="14" height="14" />
        <rect x="330" y="394" width="14" height="14" />
      </g>

      <circle className="plan-source-glow" cx="66" cy="210" r="40" fill="url(#plan-pulse-halo)" />
      <rect x="46" y="196" width="40" height="28" rx="4" fill="#F5B800" />
      <text x="66" y="215" textAnchor="middle" fontFamily="inherit" fontWeight="700" fontSize="13" fill="#0B2142">DB</text>

      {/* a pulse leaves the board on every run, then the next one follows */}
      {CIRCUIT_RUNS.map((run) => (
        <g key={run.path} className="plan-pulse">
          <animateMotion dur={run.duration} begin={run.pulseDelay} repeatCount="indefinite" path={run.path} />
          <circle r="10" fill="url(#plan-pulse-halo)" />
          <circle r="2.7" fill="#FFE49A" />
        </g>
      ))}

      <g fontFamily="inherit" fontSize="14" fill="#C3CEE2">
        <text x="60" y="60">Living</text>
        <text x="400" y="60">Bedroom 1</text>
        <text x="60" y="250">Kitchen</text>
        <text x="380" y="250">Bedroom 2</text>
        <text x="535" y="250">Bath</text>
      </g>
    </svg>
  );
}
