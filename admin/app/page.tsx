"use client";

import { SignIn, SignOutButton, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { addItem, listCatalogue, setPrice, setUnit, type CatalogueItem } from "@/lib/api";

type Tab = "prices" | "materials" | "settings";

export default function AdminPage() {
  const { isLoaded, isSignedIn, user } = useUser();
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
    setMessage(`Published ${saved} price${saved === 1 ? "" : "s"}. The web app reads them now.`);
    await load();
  };

  if (!isLoaded) return <div className="admin-auth"><p className="admin-sub">Loading…</p></div>;

  if (!isSignedIn) {
    return (
      <div className="admin-auth">
        <div className="admin-auth-card">
          <h1>ESTIMO admin</h1>
          <p>This console is separate from the customer app and uses its own administrator accounts.</p>
          <SignIn routing="hash" />
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="admin-head" style={{ padding: "18px 24px 0" }}>
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
        <div className="admin-actions">
          {(["prices", "materials", "settings"] as Tab[]).map((value) => (
            <button
              key={value}
              type="button"
              className={tab === value ? "admin-btn admin-btn-primary" : "admin-btn"}
              onClick={() => setTab(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
          <SignOutButton><button className="admin-btn" type="button">Sign out</button></SignOutButton>
        </div>
      </header>

      <div style={{ padding: "0 24px 32px" }}>
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
              <button className="admin-btn admin-btn-amber" style={{ marginTop: 12 }} type="button" onClick={() => void addItem(form).then(async (r) => { if (r.ok) { setMessage("Material added."); setForm({ name: "", category: "", unit: "each", spec: "" }); await load(); } else setError(r.error ?? "Could not add"); })}>
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
                      <td style={{ textAlign: "right" }}><button className="admin-btn" type="button" disabled={!units[item.id]} onClick={() => void setUnit(item.id, units[item.id]).then(async (r) => { if (r.ok) { setMessage("Unit updated."); await load(); } })}>Save</button></td>
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
      </div>
    </>
  );
}
