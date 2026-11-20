"use client";

import { SignIn } from "@clerk/nextjs";

/** The sign-in screen shared by the console and the add-material page. */
export function AuthScreen() {
  return (
    <div className="auth-split">
      <section className="auth-visual">
        <div className="auth-logo">estimo<span>.</span> <em>admin</em></div>

        <svg viewBox="0 0 400 260" className="auth-plan" role="img" aria-label="Floor plan with lit rooms">
          <defs>
            <radialGradient id="authGlow">
              <stop offset="0" stopColor="#F5B800" stopOpacity=".5" />
              <stop offset="1" stopColor="#F5B800" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="110" cy="80" r="90" fill="url(#authGlow)" />
          <circle cx="300" cy="70" r="75" fill="url(#authGlow)" />
          <circle cx="120" cy="200" r="80" fill="url(#authGlow)" />
          <circle cx="300" cy="200" r="60" fill="url(#authGlow)" />
          <g fill="none" stroke="#fff" strokeWidth="5">
            <rect x="10" y="10" width="380" height="240" />
            <path d="M210 10V90M210 120V250M10 130H110M150 130H390" />
          </g>
          <path d="M60 130V200H120M110 130V80M210 90H300V70" fill="none" stroke="#F5B800" strokeWidth="2.5" strokeDasharray="3 7" strokeLinecap="round" />
          <g fill="#0B2142" stroke="#F5B800" strokeWidth="2">
            {[[110, 80], [300, 70], [120, 200], [300, 200]].map(([cx, cy]) => (
              <g key={`${cx}-${cy}`}>
                <circle cx={cx} cy={cy} r="9" />
                <path d={`M${cx - 6} ${cy - 6}L${cx + 6} ${cy + 6}M${cx + 6} ${cy - 6}L${cx - 6} ${cy + 6}`} strokeLinecap="round" />
              </g>
            ))}
          </g>
          <rect x="30" y="116" width="40" height="28" rx="4" fill="#0B2142" stroke="#F5B800" strokeWidth="2" />
          <path d="M38 124V136M46 124V136M54 124V136M62 124V136" stroke="#F5B800" strokeWidth="3" />
        </svg>

        <div className="auth-copy">
          <h1>Update prices once.<br />Every estimate follows.</h1>
          <p>Manage materials, prices and project templates for the Estimo app.</p>
        </div>
        <span className="auth-foot">Authorised staff only</span>
      </section>

      <section className="auth-form-side">
        <div className="auth-clerk">
          <SignIn
            routing="hash"
            appearance={{
              variables: {
                colorPrimary: "#F5B800",
                borderRadius: "10px",
                fontFamily: "Bricolage Grotesque, -apple-system, Segoe UI, Arial, sans-serif",
              },
              elements: {
                card: { boxShadow: "none", border: "1px solid #e2e4dc", background: "#fff" },
                formButtonPrimary: { background: "#F5B800", color: "#0B2142", fontWeight: "700" },
              },
            }}
          />
        </div>
      </section>
    </div>
  );
}
