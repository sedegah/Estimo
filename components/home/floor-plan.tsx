const LIGHTS: [number, number][] = [
  [170, 130],
  [470, 110],
  [185, 320],
  [445, 320],
  [560, 330],
];

export function FloorPlan() {
  return (
    <svg
      className="home-plan-svg"
      viewBox="0 0 620 430"
      role="img"
      aria-label="Floor plan with lit rooms, sockets and a circuit run from the distribution board"
    >
      <defs>
        <radialGradient id="plan-glow">
          <stop offset="0" stopColor="#F5B800" stopOpacity=".55" />
          <stop offset="1" stopColor="#F5B800" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="170" cy="130" r="150" fill="url(#plan-glow)" />
      <circle cx="470" cy="110" r="120" fill="url(#plan-glow)" />
      <circle cx="185" cy="320" r="130" fill="url(#plan-glow)" />
      <circle cx="445" cy="320" r="90" fill="url(#plan-glow)" />
      <circle cx="560" cy="320" r="70" fill="url(#plan-glow)" />

      <g fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="square">
        <rect x="20" y="20" width="580" height="390" />
        <path d="M340 20V150M340 200V410M20 210H190M240 210H600M520 210V300M520 345V410" />
      </g>

      <path
        d="M60 210V320H185M185 210V130H170M340 150H470V110"
        fill="none"
        stroke="#F5B800"
        strokeWidth="3"
        strokeDasharray="3 8"
        strokeLinecap="round"
      />

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

      <rect x="46" y="196" width="40" height="28" rx="4" fill="#F5B800" />
      <text x="66" y="215" textAnchor="middle" fontFamily="inherit" fontWeight="700" fontSize="13" fill="#0B2142">DB</text>

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
