"use client";

import { useClerk, useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { addItem, listCatalogue, setPrice, setUnit, type CatalogueItem } from "@/lib/api";

type Tab = "prices" | "materials" | "settings";

function AuthScreen() {
  const { signIn } = useSignIn();
  const { setActive } = useClerk();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signIn) return;
    setBusy(true);
    setError("");
    try {
      const attempt = await (signIn as unknown as { create(input: { identifier: string; password: string }): Promise<{ error?: { message?: string } | null }> }).create({
        identifier: email.trim(),
        password,
      });
      if (attempt?.error) {
        setError(attempt.error.message ?? "That email and password do not match.");
        return;
      }
      const sessionId = (signIn as unknown as { createdSessionId?: string | null }).createdSessionId;
      if (sessionId) await setActive({ session: sessionId });
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not sign in.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

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
            {[
              [110, 80], [300, 70], [120, 200], [300, 200],
            ].map(([cx, cy]) => (
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
        <form className="auth-form" onSubmit={submit}>
          <div>
            <h2>Sign in</h2>
            <p className="auth-form-sub">Use your Estimo admin account.</p>
          </div>

          <label className="auth-field">
            Work email
            <input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <label className="auth-field">
            <span className="auth-field-row">
              <span>Password</span>
              <span className="auth-forgot">Forgot password?</span>
            </span>
            <input type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>

          <label className="auth-keep">
            <input type="checkbox" defaultChecked /> Keep me signed in on this computer
          </label>

          {error ? <p className="admin-error">{error}</p> : null}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <p className="auth-help">Trouble signing in? Contact your administrator.</p>
        </form>
      </section>
    </div>
  );
}

export default function AdminPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [tab, setTab] = useState<Tab>("prices");
  const [items, setItems] = useState<CatalogueItem[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", category: "", unit: "each", spec: "" });

  const load = async () => {
    const rows = await listCatalogue();
    if (rows) setItems(rows);
    else setError("Could not reach the data API.");
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) void load();
  }, [isLoaded, isSignedIn]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (items ?? []).filter((item) => !search || `${item.name} ${item.category} ${item.spec}`.toLowerCase().includes(search));
  }, [items, query]);

  const draftCount = Object.values(drafts).filter((value) => value.trim() !== "").length;

  const publish = async () => {
    let saved = 0;
    for (const [id, value] of Object.entries(drafts)) {
      if (value.trim() === "") continue;
      const result = await setPrice(id, Number(value));
      if (result.ok) saved++;
    }
    setDrafts({});
    setMessage(`Published ${saved} price${saved === 1 ? "" : "s"}.`);
    await load();
  };

  if (!isLoaded) return <div className="admin-auth"><p className="admin-sub">Loading…</p></div>;
  if (!isSignedIn) return <AuthScreen />;

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          estimo<span>.</span>&nbsp;admin
          <span className="admin-badge">Live app</span>
          <span style={{ color: "#8fa2c4", fontWeight: 500 }}>{draftCount ? `${draftCount} unpublished change${draftCount === 1 ? "" : "s"}` : "Up to date"}</span>
        </div>
        <div className="admin-user">
          <span className="admin-user-pill">{user?.primaryEmailAddress?.emailAddress}</span>
          <button className="admin-btn" type="button" style={{ minHeight: 34, padding: "6px 12px" }} onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-rail">
          <p className="admin-rail-label">Manage</p>
          <span className="admin-rail-link is-muted">Project templates</span>
          <span className="admin-rail-link is-muted">Users</span>
          <span className="admin-rail-link is-muted">Audit log</span>
          {(["prices", "materials", "settings"] as Tab[]).map((value) => (
            <button
              key={value}
              type="button"
              className={tab === value ? "admin-rail-link is-active" : "admin-rail-link"}
              onClick={() => setTab(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </aside>

        <main className="admin-main">
          <header className="admin-head">
            <div>
              <h1 className="admin-title">{tab === "prices" ? "Prices" : tab === "materials" ? "Materials" : "Settings"}</h1>
              <p className="admin-sub">
                {tab === "prices"
                  ? "Change material prices. Published values are read by the estimating app."
                  : tab === "materials"
                    ? "Add materials and correct their units."
                    : "Account and service details."}
              </p>
            </div>
          </header>

          {message ? <p className="admin-ok">{message}</p> : null}
          {error ? <p className="admin-error">{error}</p> : null}

          {tab !== "settings" ? (
            <div className="admin-toolbar">
              <input className="admin-search" placeholder="Search material" value={query} onChange={(event) => setQuery(event.target.value)} />
              <span className="admin-note">{items ? `${visible.length} of ${items.length}` : ""}</span>
            </div>
          ) : null}

          {tab === "prices" ? (
            <div className="admin-layout" style={{ marginTop: 16 }}>
              <div className="admin-panel">
                <table className="admin-table">
                  <thead>
                    <tr><th>Material</th><th>Unit</th><th>Current</th><th style={{ textAlign: "right" }}>New price</th></tr>
                  </thead>
                  <tbody>
                    {visible.map((item) => (
                      <tr key={item.id}>
                        <td><div className="name">{item.name}</div><div className="muted">{item.spec || item.code}</div></td>
                        <td className="muted">{item.unit}</td>
                        <td><span className={item.price_ghs === null ? "admin-status is-pending" : "admin-status is-set"}>{item.price_ghs === null ? "Pending" : `GHS ${item.price_ghs}`}</span></td>
                        <td style={{ textAlign: "right" }}>
                          <input className="admin-price-input" inputMode="decimal" value={drafts[item.id] ?? ""} onChange={(event) => setDrafts({ ...drafts, [item.id]: event.target.value })} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <aside className="admin-draft">
                <h2 className="admin-draft-title">Draft changes</h2>
                <p className="admin-draft-count">{draftCount ? `${draftCount} ready` : "No changes yet"}</p>
                <button className="admin-btn admin-btn-amber" type="button" disabled={!draftCount} onClick={() => void publish()}>Publish to app</button>
              </aside>
            </div>
          ) : null}

          {tab === "materials" ? (
            <>
              <div className="admin-panel" style={{ padding: 18, marginTop: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: 12 }}>
                  <input className="admin-search" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input className="admin-search" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  <input className="admin-search" placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                  <input className="admin-search" placeholder="Specification" value={form.spec} onChange={(e) => setForm({ ...form, spec: e.target.value })} />
                </div>
                <button
                  className="admin-btn admin-btn-amber"
                  style={{ marginTop: 12 }}
                  type="button"
                  onClick={() => void addItem(form).then(async (result) => {
                    if (result.ok) {
                      setMessage("Material added.");
                      setForm({ name: "", category: "", unit: "each", spec: "" });
                      await load();
                    } else {
                      setError(result.error ?? "Could not add");
                    }
                  })}
                >
                  Add material
                </button>
              </div>
              <div className="admin-panel" style={{ marginTop: 14 }}>
                <table className="admin-table">
                  <thead><tr><th>Material</th><th>Category</th><th>Unit</th><th /></tr></thead>
                  <tbody>
                    {visible.map((item) => (
                      <tr key={item.id}>
                        <td><div className="name">{item.name}</div><div className="muted">{item.spec}</div></td>
                        <td className="muted">{item.category}</td>
                        <td><input className="admin-price-input" style={{ width: "7rem", textAlign: "left" }} value={units[item.id] ?? item.unit} onChange={(e) => setUnits({ ...units, [item.id]: e.target.value })} /></td>
                        <td style={{ textAlign: "right" }}>
                          <button className="admin-btn" type="button" disabled={!units[item.id]} onClick={() => void setUnit(item.id, units[item.id]).then(async (result) => { if (result.ok) { setMessage("Unit updated."); await load(); } })}>Save</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {tab === "settings" ? (
            <div className="admin-panel" style={{ padding: 22, marginTop: 16 }}>
              <p className="admin-note">
                <strong>{user?.fullName ?? "Administrator"}</strong><br />
                {user?.primaryEmailAddress?.emailAddress ?? "—"}<br />
                Separate Clerk application: Estimo Admin
              </p>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
