"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { AdminSignIn } from "@/components/admin/admin-sign-in";
import type { CatalogueItem } from "@/lib/api/admin-types";
import { adminAddPrice, adminCatalogue, whoAmI } from "@/lib/api/admin";
import { formatGhs } from "@/lib/format";

type Filter = "all" | "pending" | "priced";

export default function AdminPricesPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [items, setItems] = useState<CatalogueItem[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let active = true;
    void (async () => {
      const me = await whoAmI();
      if (!active) return;
      if (!me?.admin) {
        setDenied(true);
        return;
      }
      const rows = await adminCatalogue();
      if (!active) return;
      if (rows) setItems(rows);
      else setError("Could not load the catalogue. Check the API URL and your connection.");
    })();
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn]);

  const visible = useMemo(() => {
    const list = items ?? [];
    const search = query.trim().toLowerCase();
    return list.filter((item) => {
      const priced = typeof item.price_ghs === "number";
      if (filter === "pending" && priced) return false;
      if (filter === "priced" && !priced) return false;
      if (!search) return true;
      return `${item.name} ${item.category} ${item.spec}`.toLowerCase().includes(search);
    });
  }, [items, query, filter]);

  const draftCount = Object.keys(drafts).filter((id) => drafts[id]?.trim() !== "").length;

  const load = async () => {
    const rows = await adminCatalogue();
    if (rows) setItems(rows);
  };

  const publish = async () => {
    const entries = Object.entries(drafts).filter(([, value]) => value.trim() !== "");
    if (!entries.length) return;
    setPublishing(true);
    setError("");
    let saved = 0;
    for (const [id, value] of entries) {
      const price = Number(value);
      if (!Number.isFinite(price) || price < 0) continue;
      const result = await adminAddPrice(id, price);
      if (result.ok) saved++;
    }
    setPublishing(false);
    setDrafts({});
    await load();
    setStatus(`Published ${saved} price${saved === 1 ? "" : "s"}.`);
  };

  if (!isLoaded) {
    return <p className="admin-sub">Loading…</p>;
  }
  if (!isSignedIn) return <AdminSignIn />;

  if (denied) {
    return (
      <>
        <h1 className="admin-title">Not authorised</h1>
        <p className="admin-sub">
          This account can use the app, but it cannot edit prices. Ask for the admin account to be added to the
          allowlist.
        </p>
      </>
    );
  }

  return (
    <>
      <header className="admin-head">
        <div>
          <h1 className="admin-title">Prices</h1>
          <p className="admin-sub">Edit material prices. Each change is stored with your account and a timestamp.</p>
        </div>
        <div className="admin-actions">
          <button className="admin-btn" type="button" onClick={() => void load()}>Refresh</button>
          <button className="admin-btn admin-btn-primary" type="button" disabled={!draftCount || publishing} onClick={() => void publish()}>
            Publish {draftCount ? `(${draftCount})` : ""}
          </button>
        </div>
      </header>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder="Search material, category or specification"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {(
          [
            ["all", "All items"],
            ["pending", "Needs a price"],
            ["priced", "Priced"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? "admin-chip is-active" : "admin-chip"}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {status ? <p className="admin-ok">{status}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-layout" style={{ marginTop: 18 }}>
        <div className="admin-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Current</th>
                <th style={{ textAlign: "right" }}>New price (GHS)</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const priced = typeof item.price_ghs === "number";
                const draft = drafts[item.id] ?? "";
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="name">{item.name}</div>
                      <div className="muted">{item.spec || item.code}</div>
                    </td>
                    <td className="muted">{item.category || "—"}</td>
                    <td className="muted">{item.unit || "—"}</td>
                    <td>
                      <span className={priced ? "admin-status is-set" : "admin-status is-pending"}>
                        {priced ? formatGhs(item.price_ghs ?? 0, 2) : "Pending"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <input
                        className={draft.trim() ? "admin-price-input is-dirty" : "admin-price-input"}
                        inputMode="decimal"
                        placeholder={priced ? String(item.price_ghs) : "0.00"}
                        value={draft}
                        onChange={(event) => {
                          setStatus("");
                          setDrafts((current) => ({ ...current, [item.id]: event.target.value }));
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
              {!visible.length ? (
                <tr>
                  <td colSpan={5} className="muted" style={{ padding: 22 }}>
                    {items ? "No materials match that search." : "Loading catalogue…"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <aside className="admin-draft">
          <h2 className="admin-draft-title">Draft changes</h2>
          <p className="admin-draft-count">
            {draftCount ? `${draftCount} price${draftCount === 1 ? "" : "s"} ready to publish` : "No unpublished changes"}
          </p>
          <ul className="admin-draft-list">
            {Object.entries(drafts)
              .filter(([, value]) => value.trim() !== "")
              .slice(0, 6)
              .map(([id, value]) => {
                const item = items?.find((row) => row.id === id);
                return (
                  <li key={id}>
                    <span>{item?.name ?? id}</span>
                    <b>{value}</b>
                  </li>
                );
              })}
          </ul>
          <div className="admin-draft-actions">
            <button className="admin-btn admin-btn-amber" type="button" disabled={!draftCount || publishing} onClick={() => void publish()}>
              Publish to app
            </button>
            <button className="admin-btn" type="button" style={{ background: "transparent", color: "#e6ecf7", borderColor: "#3b5384" }} onClick={() => setDrafts({})} disabled={!draftCount}>
              Discard changes
            </button>
          </div>
          <p className="admin-note" style={{ color: "#8fa2c4", marginTop: 16 }}>
            Published prices appear in the estimating app straight away. Figures you leave blank stay pending.
          </p>
        </aside>
      </div>
    </>
  );
}
