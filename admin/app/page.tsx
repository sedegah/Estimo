"use client";

import { SignIn, useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { deleteItem, listCatalogue, materialImageUrl, setPrice, setUnit, type CatalogueItem } from "@/lib/api";
import { ConsoleRail } from "@/components/console-rail";
import { AuthScreen } from "./auth-screen";
import { LoadingScreen } from "./loading-screen";

type Tab = "prices" | "materials" | "settings";
const PAGE_SIZE = 25;

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

/** Compact pager: previous, the page you are on, next. */
function Pager({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (next: number) => void }) {
  if (pageCount <= 1) return null;

  return (
    <div className="pager">
      <button className="pager-btn" type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">Prev</button>
      <span className="pager-pos">Page {page} of {pageCount}</span>
      <button className="pager-btn" type="button" disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Next page">Next</button>
    </div>
  );
}

function AdminPageContent() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const params = useSearchParams();

  // The rail switches tabs by changing ?tab=, so the URL is the single source of
  // truth. Deriving the tab here means a click from Prices to Materials updates
  // the screen instead of changing the address bar only.
  const requested = params.get("tab");
  const tab: Tab = requested === "materials" || requested === "settings" ? requested : "prices";

  const [items, setItems] = useState<CatalogueItem[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("All");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastPublished, setLastPublished] = useState<string | null>(null);
  const [settings, setSettings] = useState({ currency: "GHS", tier: "All", relevance: "Medium" });
  const [settingsSaved, setSettingsSaved] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
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
    setPage(1);
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

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const paged = visible.slice(start, start + PAGE_SIZE);
  const draftCount = Object.values(drafts).filter((value) => value.trim() !== "").length;

  const publish = async () => {
    let saved = 0;
    for (const [id, value] of Object.entries(drafts)) {
      if (value.trim() === "") continue;
      const result = await setPrice(id, Number(value));
      if (result.ok) saved += 1;
    }
    setDrafts({});
    setMessage(`Published ${saved} price${saved === 1 ? "" : "s"} to the app.`);
    const stamp = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
    setLastPublished(stamp);
    try {
      localStorage.setItem("estimo-admin-last-published", stamp);
      localStorage.removeItem("estimo-admin-drafts");
    } catch {}
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

  const removeMaterial = async (item: CatalogueItem) => {
    const confirmed = window.confirm(
      `Delete "${item.name}"?\n\nIts price history and photo are removed too. This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(item.id);
    setError("");
    try {
      const result = await deleteItem(item.id);
      if (!result.ok) {
        setError(result.error ?? "The material could not be deleted.");
        return;
      }
      setItems((current) => (current ?? []).filter((entry) => entry.id !== item.id));
      setDrafts((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      setMessage(`Deleted “${item.name}”.`);
    } finally {
      setDeleting(null);
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

      const storedDrafts = localStorage.getItem("estimo-admin-drafts");
      if (storedDrafts) setDrafts(JSON.parse(storedDrafts) as Record<string, string>);

      const storedStamp = localStorage.getItem("estimo-admin-last-published");
      if (storedStamp) setLastPublished(storedStamp);
    } catch {}
  }, []);

  // unpublished edits survive a reload, like the drafts they are
  useEffect(() => {
    try {
      if (Object.keys(drafts).length) localStorage.setItem("estimo-admin-drafts", JSON.stringify(drafts));
    } catch {}
  }, [drafts]);

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <AuthScreen />;

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/brand/estimo-logo-horizontal-dark.png" alt="ESTIMO" />
          <span className="brand-role">admin</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-user">{user?.primaryEmailAddress?.emailAddress}</span>
          <button className="btn btn-outline-light btn-sm" type="button" onClick={() => void signOut()}>Sign out</button>
        </div>
      </header>

      <div className="body">
        <ConsoleRail active={tab === "materials" ? "Materials" : tab === "settings" ? "Settings" : "Prices"} />

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
                  <button className="btn btn-sm" type="button" disabled={!draftCount} onClick={() => { setDrafts({}); try { localStorage.removeItem("estimo-admin-drafts"); } catch {} }}>Discard</button>
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
                <span>Showing {visible.length ? start + 1 : 0}–{start + paged.length} of {visible.length} items</span>
                <Pager page={safePage} pageCount={pageCount} onChange={setPage} />
              </div>
            </section>
          ) : null}

          {tab === "materials" ? (
            <section className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th className="col-thumb" />
                    <th>Material</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th className="col-check" />
                    <th className="col-actions" />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((item) => (
                    <tr key={item.id}>
                      <td className="col-thumb">
                        {item.image_key ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className="thumb"
                            src={materialImageUrl(item.image_key)}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <span className="thumb thumb-empty" aria-hidden="true">
                            {item.category?.slice(0, 1).toUpperCase() ?? "·"}
                          </span>
                        )}
                      </td>
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
                      <td className="col-actions">
                        <button
                          className="btn btn-sm btn-danger"
                          type="button"
                          disabled={deleting === item.id}
                          onClick={() => void removeMaterial(item)}
                        >
                          {deleting === item.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-foot">
                <span>Showing {visible.length ? start + 1 : 0}–{start + paged.length} of {visible.length} materials</span>
                <Pager page={safePage} pageCount={pageCount} onChange={setPage} />
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

/**
 * useSearchParams opts this page into client-side rendering. The Suspense
 * boundary is what Next.js asks for while prerendering the shell.
 */
export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AdminPageContent />
    </Suspense>
  );
}
