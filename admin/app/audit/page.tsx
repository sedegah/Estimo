"use client";

import { useCallback, useEffect, useState } from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import { ConsoleRail } from "../../components/console-rail";
import { LoadingScreen } from "../loading-screen";
import { listAudit, revertPrice } from "@/lib/admin-estimates";
import { money, shortDate, type AdminAuditEntry } from "@/lib/estimate-admin";

const ACTIONS = [
  "price.create",
  "catalogue.create",
  "catalogue.update",
  "catalogue.delete",
  "catalogue.image",
  "catalogue.price.revert",
];

const label = (action: string) => action.replace(/\./g, " · ");

export default function AdminAuditPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await listAudit({ entity });
    if (!rows) {
      setError("Could not load the audit log. Sign in again or check the API.");
      setEntries([]);
    } else {
      setError("");
      setEntries(rows);
    }
    setLoading(false);
  }, [entity]);

  useEffect(() => {
    if (!isSignedIn) return;
    void load();
  }, [isSignedIn, load]);

  const visible = action ? entries.filter((entry) => entry.action === action) : entries;

  const revert = async (entry: AdminAuditEntry) => {
    if (!entry.entity_id) return;
    setBusy(entry.id);
    const result = await revertPrice(entry.entity_id);
    setBusy("");
    if (result.ok) {
      setNotice(`Reverted the last price on ${entry.entity_id}. Current price: ${money(result.price)}`);
      await load();
    } else {
      setNotice(`Could not revert ${entry.entity_id}. There may be no price left.`);
    }
  };

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) {
    return (
      <div className="auth-wrap">
        <SignIn routing="hash" />
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/brand/estimo-logo-horizontal-dark.png" alt="ESTIMO" />
          <span className="brand-role">admin</span>
        </div>
        <div className="topbar-right">
          <a className="btn btn-outline-light btn-sm" href="/">Back to console</a>
        </div>
      </header>

      <div className="body">
        <ConsoleRail active="Audit log" />
        <main className="main">
          <div className="head">
            <div>
              <h1>Audit log</h1>
              <p>Every change to prices and materials, with who made it.</p>
            </div>
          </div>

          <div className="toolbar">
            <select className="aq-input" value={action} onChange={(event) => setAction(event.target.value)}>
              <option value="">All actions</option>
              {ACTIONS.map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </select>
            <select className="aq-input" value={entity} onChange={(event) => setEntity(event.target.value)}>
              <option value="">All records</option>
              <option value="catalogue_item">Catalogue items</option>
              <option value="catalogue_price">Prices</option>
            </select>
            <span className="toolbar-count">{visible.length} entries</span>
          </div>

          {notice ? <p className="cell-muted" style={{ margin: "10px 0" }}>{notice}</p> : null}
          {error ? <p className="aq-warnings" style={{ margin: "12px 0" }}>{error}</p> : null}

          <section className="panel" style={{ marginTop: 16 }}>
            <div className="panel-head"><h2>Recent changes</h2></div>
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Action</th>
                    <th>Record</th>
                    <th>Detail</th>
                    <th>Actor</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="cell-muted">Loading…</td></tr>
                  ) : visible.length === 0 ? (
                    <tr><td colSpan={6} className="cell-muted">Nothing recorded yet.</td></tr>
                  ) : (
                    visible.map((entry) => (
                      <tr key={entry.id}>
                        <td className="cell-muted">{shortDate(entry.created_at)}</td>
                        <td>{label(entry.action)}</td>
                        <td className="cell-muted">{entry.entity.replace(/_/g, " ")}{entry.entity_id ? ` · ${entry.entity_id}` : ""}</td>
                        <td className="cell-muted" style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.detail ?? "—"}
                        </td>
                        <td className="cell-muted">{entry.actor_key.slice(0, 10)}…</td>
                        <td>
                          {entry.action === "price.create" && entry.entity_id ? (
                            <button
                              className="btn btn-ghost btn-sm"
                              type="button"
                              disabled={busy === entry.id}
                              onClick={() => void revert(entry)}
                            >
                              {busy === entry.id ? "Reverting…" : "Revert price"}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
