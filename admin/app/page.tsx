"use client";

import { SignIn, useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { listCatalogue, setPrice, setUnit, type CatalogueItem } from "@/lib/api";
import { LoadingScreen } from "./loading-screen";

type Tab = "prices" | "materials" | "settings";
const PAGE_STEP = 6;

/** Prices accept digits and one decimal separator; commas become periods. */
function cleanPrice(value: string): string {
  const stripped = value.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
  const [whole, ...rest] = stripped.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
}

const money = (value: number | null | undefined) =>
  value === null || value === undefined ? "Not priced" : `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function useDebounced<T>(value: T, delay = 220): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

const Icon = ({ path }: { path: string }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={path} />
  </svg>
);

const ICONS = {
  prices: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.8A2 2 0 0 1 4.8 2.8H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8Z M7.5 7.5h.01",
  materials: "M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z M3 7.5 12 12l9-4.5 M12 12v9",
  add: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 8v8 M8 12h8",
  builder: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z M14 3v5h5 M9 13h6 M9 17h4",
  settings: "M4 7h10 M18 7h2 M4 17h2 M10 17h10 M16 4v6 M8 14v6",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3",
  plus: "M12 5v14 M5 12h14",
  upload: "M12 16V4 M7 9l5-5 5 5 M4 20h16",
  download: "M12 4v12 M7 11l5 5 5-5 M4 20h16",
  back: "M19 12H5 M11 18l-6-6 6-6",
};

export default function AdminPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const [tab, setTab] = useState<Tab>("prices");
  const [items, setItems] = useState<CatalogueItem[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("All");
  const [pageSize, setPageSize] = useState(PAGE_STEP);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastPublished, setLastPublished] = useState<string | null>(null);
  const [settings, setSettings] = useState({ currency: "GHS", tier: "All", relevance: "Medium" });
  const [settingsSaved, setSettingsSaved] = useState("");
  const csvRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounced(query);

  const load = async () => {
    const rows = await listCatalogue();
    if (rows) setItems(rows);
    else setError("Could not reach the data API.");
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) void load();
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    setPageSize(PAGE_STEP);
  }, [debouncedQuery, chip, tab]);

  const categories = useMemo(
    () => Array.from(new Set((items ?? []).map((item) => item.category).filter(Boolean))).slice(0, 8),
    [items],
  );

  const searched = useMemo(() => {
    const search = debouncedQuery.trim().toLowerCase();
    return (items ?? []).filter((item) => !search || `${item.name} ${item.category} ${item.spec} ${item.code}`.toLowerCase().includes(search));
  }, [items, debouncedQuery]);

  const visible = useMemo(
    () => searched.filter((item) => chip === "All" || item.category === chip),
    [searched, chip],
  );

  const paged = visible.slice(0, pageSize);
  const draftCount = Object.values(drafts).filter((value) => value.trim() !== "").length;

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
      if (item && second && Number.isFinite(Number(second))) {
        next[item.id] = String(Number(second));
        matched += 1;
      }
    }
    setDrafts((current) => ({ ...current, ...next }));
    setMessage(matched ? `Imported ${matched} price${matched === 1 ? "" : "s"} as drafts. Review, then publish.` : "No matching rows found.");
  };

  const publish = async () => {
    let saved = 0;
    for (const [id, value] of Object.entries(drafts)) {
      if (value.trim() === "") continue;
      const result = await setPrice(id, Number(value));
      if (result.ok) saved += 1;
    }
    setDrafts({});
    setMessage(`Published ${saved} price${saved === 1 ? "" : "s"} to the app.`);
    setLastPublished(new Date().toLocaleDateString("en-GB"));
    await load();
  };

  const saveUnit = async (id: string) => {
    const unit = units[id];
    if (!unit) return;
    const result = await setUnit(id, unit);
    if (result.ok) {
      setMessage("Unit saved.");
      setItems((current) => (current ?? []).map((item) => (item.id === id ? { ...item, unit } : item)));
    } else {
      setError(result.error ?? "Could not save the unit.");
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem("estimo-admin-settings", JSON.stringify(settings));
    } catch {}
    setSettingsSaved("Settings saved.");
    setTimeout(() => setSettingsSaved(""), 2500);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("estimo-admin-settings");
      if (stored) setSettings((current) => ({ ...current, ...JSON.parse(stored) }));
    } catch {}
  }, []);

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) {
    return (
      <div className="auth-wrap">
        <SignIn routing="hash" />
      </div>
    );
  }

  const title = tab === "prices" ? "Prices" : tab === "materials" ? "Materials" : "Settings";
  const subtitle =
    tab === "prices"
      ? "Edit prices in the table, then publish. The estimating app only reads published values."
      : tab === "materials"
        ? "Browse the catalogue and correct units. New materials are added on their own page."
        : "Account details and the defaults used across the catalogue.";

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">e</span>
          <span className="brand-name">estimo</span>
          <span className="brand-role">admin</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-user">{user?.primaryEmailAddress?.emailAddress}</span>
          <button className="btn btn-outline-light btn-sm" type="button" onClick={() => void signOut()}>Sign out</button>
        </div>
      </header>

      <div className="body">
        <aside className="rail">
          <p className="rail-label">Manage</p>
          <button type="button" className={tab === "prices" ? "rail-item is-active" : "rail-item"} onClick={() => setTab("prices")}>
            <Icon path={ICONS.prices} /> Prices
          </button>
          <button type="button" className={tab === "materials" ? "rail-item is-active" : "rail-item"} onClick={() => setTab("materials")}>
            <Icon path={ICONS.materials} /> Materials
          </button>
          <Link className="rail-item" href="/materials/new">
            <Icon path={ICONS.add} /> Add material
          </Link>
          <a className="rail-item" href="/builder">
            <Icon path={ICONS.builder} /> Estimate builder
          </a>
          <button type="button" className={tab === "settings" ? "rail-item is-active" : "rail-item"} onClick={() => setTab("settings")}>
            <Icon path={ICONS.settings} /> Settings
          </button>
        </aside>

        <main className="main">
          <header className="head">
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {tab === "prices" ? (
              <div className="publish">
                <div className="publish-copy">
                  <strong>{draftCount ? `${draftCount} unpublished change${draftCount === 1 ? "" : "s"}` : "No unpublished changes"}</strong>
                  <span>Last published: {lastPublished ?? "—"}</span>
                </div>
                <div className="publish-actions">
                  <button className="btn btn-sm" type="button" disabled={!draftCount} onClick={() => setDrafts({})}>Discard</button>
                  <button className="btn btn-amber btn-sm" type="button" disabled={!draftCount} onClick={() => void publish()}>Publish to app</button>
                </div>
              </div>
            ) : null}
            {tab === "materials" ? (
              <div className="head-actions">
                <Link className="btn btn-amber" href="/materials/new">
                  <Icon path={ICONS.plus} /> Add material
                </Link>
              </div>
            ) : null}
          </header>

          {message ? <p className="banner banner-ok">{message}</p> : null}
          {error ? <p className="banner banner-error">{error}</p> : null}

          {tab !== "settings" ? (
            <>
              <div className="toolbar">
                <div className="search">
                  <Icon path={ICONS.search} />
                  <input
                    placeholder={tab === "prices" ? "Search items" : "Search materials"}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <span className="toolbar-count">{visible.length} {tab === "prices" ? "items" : "materials"}</span>
                <div className="toolbar-actions">
                  {tab === "prices" ? (
                    <>
                      <button className="btn btn-sm" type="button" onClick={() => csvRef.current?.click()}>
                        <Icon path={ICONS.upload} /> Import CSV
                      </button>
                      <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.target.value = ""; }} />
                      <button className="btn btn-sm" type="button" onClick={exportCsv}>
                        <Icon path={ICONS.download} /> Export
                      </button>
                      <Link className="btn btn-navy btn-sm" href="/materials/new">
                        <Icon path={ICONS.plus} /> Add item
                      </Link>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="chips">
                {["All", ...categories].map((category) => (
                  <button key={category} type="button" className={chip === category ? "chip is-active" : "chip"} onClick={() => setChip(category)}>
                    {category}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {tab === "prices" ? (
            <section className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th className="col-check" />
                    <th>Item</th>
                    <th>Unit</th>
                    <th>Current</th>
                    <th>New price</th>
                    <th>Change</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((item) => {
                    const draft = drafts[item.id] ?? "";
                    const current = item.price_ghs;
                    const next = draft.trim() === "" ? null : Number(draft);
                    const change = current && next ? Math.round(((next - current) / current) * 100) : null;
                    return (
                      <tr key={item.id} className={draft.trim() ? "is-draft" : undefined}>
                        <td className="col-check"><input type="checkbox" aria-label={`Select ${item.name}`} /></td>
                        <td>
                          <div className="item-name">{item.name}</div>
                          <div className="item-sub">{item.category || "—"}</div>
                        </td>
                        <td className="cell-muted">{item.unit || "—"}</td>
                        <td className="money">{money(current)}</td>
                        <td>
                          <label className={draft.trim() ? "price-field is-dirty" : "price-field"}>
                            <span>GHS</span>
                            <input
                              inputMode="decimal"
                              placeholder="—"
                              value={draft}
                              onChange={(event) => setDrafts({ ...drafts, [item.id]: cleanPrice(event.target.value) })}
                            />
                          </label>
                        </td>
                        <td>
                          {change === null ? (
                            <span className="cell-muted">—</span>
                          ) : (
                            <span className={change > 0 ? "pill pill-up" : "pill pill-down"}>
                              {change > 0 ? "↑" : "↓"} {change > 0 ? "+" : ""}{change}%
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={next !== null ? "pill pill-draft" : current !== null ? "pill pill-live" : "pill pill-pending"}>
                            {next !== null ? "Draft" : current !== null ? "Live" : "Not priced"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="table-foot">
                <span>Showing {paged.length} of {visible.length} items</span>
                {paged.length < visible.length ? (
                  <button className="btn btn-sm" type="button" onClick={() => setPageSize((size) => size + PAGE_STEP)}>Show more</button>
                ) : null}
              </div>
            </section>
          ) : null}

          {tab === "materials" ? (
            <section className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th className="col-check" />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="item-name">{item.name}</div>
                        <div className="item-sub">{item.spec || item.code || "—"}</div>
                      </td>
                      <td className="cell-muted">{item.category || "—"}</td>
                      <td>
                        <div className="unit-row">
                          <input
                            className="unit-field"
                            value={units[item.id] ?? item.unit ?? ""}
                            onChange={(event) => setUnits({ ...units, [item.id]: event.target.value })}
                          />
                          <button
                            className="btn btn-sm"
                            type="button"
                            disabled={!units[item.id] || units[item.id] === item.unit}
                            onClick={() => void saveUnit(item.id)}
                          >
                            Save
                          </button>
                        </div>
                      </td>
                      <td className="col-check" />
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-foot">
                <span>Showing {paged.length} of {visible.length} materials</span>
                {paged.length < visible.length ? (
                  <button className="btn btn-sm" type="button" onClick={() => setPageSize((size) => size + PAGE_STEP)}>Show more</button>
                ) : null}
              </div>
            </section>
          ) : null}

          {tab === "settings" ? (
            <div className="stack" style={{ maxWidth: 920 }}>
              {settingsSaved ? <p className="banner banner-ok">{settingsSaved}</p> : null}
              <section className="panel">
                <div className="panel-head"><h2>Account</h2></div>
                <div className="kv-row">
                  <div>
                    <strong>Signed in as</strong>
                    <small>{user?.primaryEmailAddress?.emailAddress ?? "—"}</small>
                  </div>
                  <button className="btn btn-sm" type="button" onClick={() => void signOut()}>Sign out</button>
                </div>
              </section>

              <section className="panel">
                <div className="panel-head"><h2>Pricing</h2></div>
                <div className="kv-row">
                  <div>
                    <strong>Currency</strong>
                    <small>Used for every price in the catalogue and in the estimating app.</small>
                  </div>
                  <select value={settings.currency} onChange={(event) => setSettings({ ...settings, currency: event.target.value })}>
                    <option value="GHS">GHS (Ghana cedi)</option>
                  </select>
                </div>
              </section>

              <section className="panel">
                <div className="panel-head"><h2>New material defaults</h2></div>
                <div className="kv-row">
                  <div>
                    <strong>Quality tier</strong>
                    <small>Pre-selected on the Add material page.</small>
                  </div>
                  <select value={settings.tier} onChange={(event) => setSettings({ ...settings, tier: event.target.value })}>
                    {["All", "Value / Standard", "Standard", "Standard / Premium", "Premium"].map((tier) => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
                </div>
                <div className="kv-row">
                  <div>
                    <strong>Quick-build relevance</strong>
                    <small>Pre-selected on the Add material page.</small>
                  </div>
                  <select value={settings.relevance} onChange={(event) => setSettings({ ...settings, relevance: event.target.value })}>
                    {["High", "Medium", "Low"].map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </section>

              <div className="form-actions">
                <button className="btn btn-amber" type="button" onClick={saveSettings}>Save settings</button>
                <button className="btn" type="button" onClick={() => setSettings({ currency: "GHS", tier: "All", relevance: "Medium" })}>Cancel</button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
