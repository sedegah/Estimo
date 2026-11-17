"use client";

import { SignIn, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { addItem, listCatalogue, setPrice, setUnit, type CatalogueItem } from "@/lib/api";
import { LoadingScreen } from "./loading-screen";

/** Prices accept digits and one decimal separator only; commas become periods. */
function cleanPrice(value: string): string {
  const stripped = value.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
  const [whole, ...rest] = stripped.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
}
type Tab = "prices" | "materials" | "builder" | "settings";
const PAGE_SIZE = 20;

function AuthScreen() {
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
function useDebounced<T>(value: T, delay = 250): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
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
  const [form, setForm] = useState({ name: "", category: "", unit: "", spec: "" });
  const [chip, setChip] = useState("All");
  const [page, setPage] = useState(1);
  const csvRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounced(query);
  const [lastPublished, setLastPublished] = useState<string | null>(null);

  const load = async () => {
    const rows = await listCatalogue();
    if (rows) setItems(rows);
    else setError("Could not reach the data API.");
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) void load();
  }, [isLoaded, isSignedIn]);

  const categories = useMemo(() => Array.from(new Set((items ?? []).map((item) => item.category).filter(Boolean))).slice(0, 6), [items]);

  const visible = useMemo(() => {
    const search = debouncedQuery.trim().toLowerCase();
    return (items ?? []).filter((item) => (chip === "All" || item.category === chip) && (!search || `${item.name} ${item.category} ${item.spec}`.toLowerCase().includes(search)));
  }, [items, debouncedQuery, chip]);


  const visibleMaterials = useMemo(() => {
    const search = debouncedQuery.trim().toLowerCase();
    return (items ?? []).filter((item) => !search || `${item.name} ${item.category} ${item.spec} ${item.code}`.toLowerCase().includes(search));
  }, [items, debouncedQuery]);
  const pageCount = Math.max(1, Math.ceil(Math.max(visible.length, visibleMaterials.length) / PAGE_SIZE));
  const pagedPrices = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedMaterials = visibleMaterials.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [query, chip, tab]);

  const exportCsv = () => {
    const rows = [["id", "name", "category", "unit", "price_ghs"], ...(items ?? []).map((item) => [item.id, item.name, item.category, item.unit, item.price_ghs ?? ""])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "estimo-prices.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    const next: Record<string, string> = {};
    let matched = 0;
    for (const line of lines) {
      const cells = line.split(",").map((cell) => cell.replace(/^"|"$/g, "").trim());
      if (cells.length < 2) continue;
      const [first, second] = cells;
      if (/price/i.test(first)) continue;
      const item = (items ?? []).find((entry) => entry.id === first || entry.name.toLowerCase() === first.toLowerCase());
      const price = second;
      if (item && price && Number.isFinite(Number(price))) {
        next[item.id] = String(Number(price));
        matched += 1;
      }
    }
    setDrafts((current) => ({ ...current, ...next }));
    setMessage(matched ? `Imported ${matched} price${matched === 1 ? "" : "s"} as drafts. Review, then publish.` : "No matching rows found. Use columns: id or name, then price.");
  };
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
    setLastPublished(new Date().toLocaleDateString("en-GB"));
    await load();
  };

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <AuthScreen />;

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          <img src="/brand/estimo-logo-horizontal-dark.png" alt="ESTIMO" className="admin-brand-logo" />
          <span className="admin-brand-admin">admin</span>
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
          <button type="button" className={tab === "prices" ? "admin-rail-link is-active" : "admin-rail-link"} onClick={() => setTab("prices")}>Prices</button>
          <button type="button" className={tab === "materials" ? "admin-rail-link is-active" : "admin-rail-link"} onClick={() => setTab("materials")}>Materials</button>
          <a className="admin-rail-link" href="/builder">Estimate builder</a>
          <button type="button" className={tab === "settings" ? "admin-rail-link is-active" : "admin-rail-link"} onClick={() => setTab("settings")}>Settings</button>
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


          {tab === "prices" ? (
            <>
              <div className="admin-toolbar prices-toolbar">
                <input className="admin-search" placeholder="Search items" value={query} onChange={(event) => setQuery(event.target.value)} />
                <span className="admin-note">{items ? `${visible.length} of ${items.length}` : ""}</span>
                <div className="admin-actions">
                  <button className="admin-btn" type="button" onClick={() => csvRef.current?.click()}>Import CSV</button>
                  <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.target.value = ""; }} />
                  <button className="admin-btn" type="button" onClick={exportCsv}>Export</button>
                  <button className="admin-btn admin-btn-primary" type="button" onClick={() => { setTab("materials"); setMessage(""); }}>Add item</button>
                </div>
              </div>
              <div className="admin-chips">
                {["All", ...categories].map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={chip === category ? "admin-chip is-active" : "admin-chip"}
                    onClick={() => setChip(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="admin-layout" style={{ marginTop: 16 }}>
                <div className="admin-panel">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th className="check" />
                        <th>Item</th>
                        <th>Category</th>
                        <th>Unit</th>
                        <th>Current</th>
                        <th>New price</th>
                        <th>Change</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedPrices.map((item) => {
                        const draft = drafts[item.id] ?? "";
                        const current = item.price_ghs;
                        const next = draft.trim() === "" ? null : Number(draft);
                        const change = current && next ? Math.round(((next - current) / current) * 100) : null;
                        return (
                          <tr key={item.id}>
                            <td className="check"><input type="checkbox" aria-label={`Select ${item.name}`} /></td>
                            <td><div className="name">{item.name}</div></td>
                            <td className="muted">{item.category || "—"}</td>
                            <td className="muted">{item.unit || "—"}</td>
                            <td className="muted">{current === null ? "Pending" : `GHS ${current}`}</td>
                            <td>
                              <input
                                className={draft.trim() ? "admin-price-input is-dirty" : "admin-price-input"}
                                inputMode="decimal"
                                placeholder="—"
                                value={draft}
                                onChange={(event) => setDrafts({ ...drafts, [item.id]: cleanPrice(event.target.value) })}
                              />
                            </td>
                            <td className={change === null ? "muted" : change > 0 ? "admin-up" : "admin-down"}>{change === null ? "—" : `${change > 0 ? "+" : ""}${change}%`}</td>
                            <td><span className={next !== null ? "admin-status is-changed" : current !== null ? "admin-status is-set" : "admin-status is-pending"}>{next !== null ? "Changed" : current !== null ? "Live" : "Pending"}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <aside className="admin-draft">
                  <h2 className="admin-draft-title">Draft changes</h2>
                  <p className="admin-draft-count">
                    {draftCount ? `${draftCount} price${draftCount === 1 ? "" : "s"} edited, not yet live` : "No unpublished changes"}
                  </p>
                  <ul className="admin-draft-list">
                    {Object.entries(drafts)
                      .filter(([, value]) => value.trim() !== "")
                      .slice(0, 6)
                      .map(([id, value]) => (
                        <li key={id}>
                          <span>{items?.find((row) => row.id === id)?.name ?? id}</span>
                          <b>{value}</b>
                        </li>
                      ))}
                  </ul>
                  <p className="admin-draft-last">Last published {lastPublished ?? "—"}</p>
                  <div className="admin-draft-actions">
                    <button className="admin-btn admin-btn-amber" type="button" disabled={!draftCount} onClick={() => void publish()}>Publish to app</button>
                    <button className="admin-btn admin-btn-ghost" type="button" disabled={!draftCount} onClick={() => setDrafts({})}>Discard changes</button>
                  </div>
                </aside>
              </div>
            </>
          ) : null}
          {tab === "materials" ? (
            <>
              <div className="admin-toolbar" style={{ marginTop: 16 }}>
              <input className="admin-search" placeholder="Search materials" value={query} onChange={(event) => setQuery(event.target.value)} />
              <span className="admin-note">{items ? `${visibleMaterials.length} of ${items.length}` : ""}</span>
            </div>
            <div className="admin-panel" style={{ padding: 18, marginTop: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: 12 }}>
                  <input className="admin-search" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input className="admin-search" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  <input className="admin-search" placeholder="Unit (each, roll, metre)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                  <input className="admin-search" placeholder="Specification" value={form.spec} onChange={(e) => setForm({ ...form, spec: e.target.value })} />
                </div>
                <button
                  className="admin-btn admin-btn-amber"
                  style={{ marginTop: 12 }}
                  type="button"
                  onClick={() => void addItem(form).then(async (result) => {
                    if (result.ok) {
                      setMessage("Material added.");
                      setForm({ name: "", category: "", unit: "", spec: "" });
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
                    {pagedMaterials.map((item) => (
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

          {tab !== "settings" ? (
            <div className="admin-pager">
              <button className="admin-btn" type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
              <span className="admin-note">Page {page} of {pageCount}</span>
              <button className="admin-btn" type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
            </div>
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
