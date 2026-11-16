"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { AdminSignIn } from "@/components/admin/admin-sign-in";
import type { CatalogueItem } from "@/lib/api/admin-types";
import { adminAddItem, adminCatalogue, adminUpdateItem, whoAmI } from "@/lib/api/admin";

const emptyForm = { name: "", category: "", unit: "each", spec: "", tier: "standard", relevance: "common" };

export default function AdminMaterialsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [items, setItems] = useState<CatalogueItem[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [unitDrafts, setUnitDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    const rows = await adminCatalogue();
    if (rows) setItems(rows);
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void (async () => {
      const me = await whoAmI();
      if (!me?.admin) {
        setDenied(true);
        return;
      }
      await load();
    })();
  }, [isLoaded, isSignedIn]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    const list = items ?? [];
    if (!search) return list;
    return list.filter((item) => `${item.name} ${item.category} ${item.spec} ${item.code}`.toLowerCase().includes(search));
  }, [items, query]);

  const addItem = async () => {
    setError("");
    setMessage("");
    if (!form.name.trim()) {
      setError("Give the material a name.");
      return;
    }
    const result = await adminAddItem(form);
    if (!result.ok) {
      setError(result.error ?? "Could not add the item.");
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    setMessage("Item added.");
    await load();
  };

  const saveUnit = async (id: string) => {
    const unit = unitDrafts[id];
    if (!unit) return;
    const result = await adminUpdateItem(id, { unit });
    if (!result.ok) {
      setError(result.error ?? "Could not update the unit.");
      return;
    }
    setMessage("Unit updated.");
    setUnitDrafts((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    await load();
  };

  if (!isLoaded) return <p className="admin-sub">Loading…</p>;
  if (!isSignedIn) return <AdminSignIn />;
  if (denied) {
    return (
      <>
        <h1 className="admin-title">Not authorised</h1>
        <p className="admin-sub">Only the admin account can add materials.</p>
      </>
    );
  }

  return (
    <>
      <header className="admin-head">
        <div>
          <h1 className="admin-title">Materials</h1>
          <p className="admin-sub">The catalogue the estimating app searches. Add materials here, then price them.</p>
        </div>
        <div className="admin-actions">
          <button className="admin-btn admin-btn-primary" type="button" onClick={() => setShowForm((value) => !value)}>
            {showForm ? "Close form" : "Add item"}
          </button>
        </div>
      </header>

      {showForm ? (
        <section className="admin-panel" style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: 14 }}>
            <div className="admin-field">
              <label htmlFor="m-name">Name</label>
              <input id="m-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="2.5mm twin and earth cable" />
            </div>
            <div className="admin-field">
              <label htmlFor="m-category">Category</label>
              <input id="m-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Cables" />
            </div>
            <div className="admin-field">
              <label htmlFor="m-unit">Unit</label>
              <input id="m-unit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="roll" />
            </div>
            <div className="admin-field">
              <label htmlFor="m-spec">Specification</label>
              <input id="m-spec" value={form.spec} onChange={(event) => setForm({ ...form, spec: event.target.value })} placeholder="100m roll" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="admin-btn admin-btn-amber" type="button" onClick={() => void addItem()}>Save item</button>
            <button className="admin-btn" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </section>
      ) : null}

      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Search materials" value={query} onChange={(event) => setQuery(event.target.value)} />
        <span className="admin-note">{items ? `${visible.length} of ${items.length} materials` : "Loading…"}</span>
      </div>

      {message ? <p className="admin-ok">{message}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-panel" style={{ marginTop: 14 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Price</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="name">{item.name}</div>
                  <div className="muted">{item.spec || item.code}</div>
                </td>
                <td className="muted">{item.category || "—"}</td>
                <td>
                  <input
                    className="admin-price-input"
                    style={{ width: "7rem", textAlign: "left" }}
                    value={unitDrafts[item.id] ?? item.unit ?? ""}
                    onChange={(event) => setUnitDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                  />
                </td>
                <td className="muted">{typeof item.price_ghs === "number" ? `GHS ${item.price_ghs}` : "Pending"}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="admin-btn" type="button" disabled={!unitDrafts[item.id]} onClick={() => void saveUnit(item.id)}>
                    Save unit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
