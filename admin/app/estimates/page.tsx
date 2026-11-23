"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import { ConsoleRail } from "../../components/console-rail";
import { LoadingScreen } from "../loading-screen";
import { estimatesToCsv, money, shortDate, type AdminEstimate } from "@/lib/estimate-admin";
import { listAdminEstimates, getAdminEstimate, type AdminEstimateDetail } from "@/lib/admin-estimates";

const TEMPLATES = [
  "HOME-2B",
  "HOME-1R",
  "HOME-1B",
  "HOME-3B",
  "HOME-4B",
  "SHOP-KIOSK",
  "SHOP-RETAIL",
  "COMM-OFF-S",
  "IND-WORK",
];

export default function AdminEstimatesPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [rows, setRows] = useState<AdminEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [template, setTemplate] = useState("");
  const [detail, setDetail] = useState<AdminEstimateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listAdminEstimates({ q: query, template });
    if (!result) {
      setError("Could not reach the estimate register. Sign in again or check the API.");
      setRows([]);
    } else {
      setError("");
      setRows(result);
    }
    setLoading(false);
  }, [query, template]);

  useEffect(() => {
    if (!isSignedIn) return;
    const timer = setTimeout(() => void load(), 220);
    return () => clearTimeout(timer);
  }, [isSignedIn, load]);

  const totals = useMemo(() => {
    const priced = rows.filter((row) => row.totalGhs !== null);
    const value = priced.reduce((sum, row) => sum + (row.totalGhs ?? 0), 0);
    const pending = rows.reduce((sum, row) => sum + row.pendingLines, 0);
    return { count: rows.length, priced: priced.length, value, pending };
  }, [rows]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    const result = await getAdminEstimate(id);
    setDetail(result);
    setDetailLoading(false);
  };

  const exportCsv = () => {
    const csv = estimatesToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estimo-estimates-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
        <ConsoleRail active="Estimates" />
        <main className="main">
          <div className="head">
            <div>
              <h1>Estimates</h1>
              <p>Every estimate saved to this account, with the take-off behind it.</p>
            </div>
            <div className="head-actions">
              <button className="btn btn-outline-light" type="button" onClick={exportCsv} disabled={!rows.length}>
                Export CSV
              </button>
            </div>
          </div>

          <div className="toolbar">
            <input
              className="aq-input"
              style={{ minWidth: 240 }}
              placeholder="Search name, template or owner"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select className="aq-input" value={template} onChange={(event) => setTemplate(event.target.value)}>
              <option value="">All templates</option>
              {TEMPLATES.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
            <span className="toolbar-count">
              {totals.count} estimates · {totals.priced} priced · {money(totals.value)} · {totals.pending} pending lines
            </span>
          </div>

          {error ? <p className="aq-warnings" style={{ margin: "12px 0" }}>{error}</p> : null}

          <section className="panel" style={{ marginTop: 16 }}>
            <div className="panel-head"><h2>Saved estimates</h2></div>
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Estimate</th>
                    <th>Spec</th>
                    <th>Spaces</th>
                    <th>Lines</th>
                    <th>Special</th>
                    <th>Total</th>
                    <th>Owner</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="cell-muted">Loading…</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={9} className="cell-muted">No estimates match yet.</td></tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id}>
                        <td className="cell-muted">{shortDate(row.createdAt)}</td>
                        <td>{row.name}</td>
                        <td className="cell-muted">{row.specLevel} · {row.template}</td>
                        <td className="cell-muted">{row.spaces}</td>
                        <td className="cell-muted">{row.pricedLines}/{row.lines}</td>
                        <td className="cell-muted">{row.specialLoads || "—"}</td>
                        <td>{money(row.totalGhs)}</td>
                        <td className="cell-muted">{row.owner.slice(0, 10)}…</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" type="button" onClick={() => void openDetail(row.id)}>
                            Open
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {detailLoading ? <p className="cell-muted">Loading the take-off…</p> : null}
          {detail ? (
            <section className="panel" style={{ marginTop: 16 }}>
              <div className="panel-head">
                <h2>{detail.estimate.name}</h2>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDetail(null)}>Close</button>
              </div>
              <div className="panel-body">
                <p className="cell-muted" style={{ marginTop: 0 }}>
                  {detail.estimate.spaces} spaces · {detail.estimate.specLevel} · {detail.estimate.ruleSet ?? "rule set not recorded"} ·{" "}
                  {money(detail.estimate.totalGhs)}
                </p>

                <h3>Spaces</h3>
                <table className="table">
                  <thead>
                    <tr><th>Space</th><th>Room type</th><th>Dimensions</th><th>Area</th></tr>
                  </thead>
                  <tbody>
                    {(detail.snapshot?.quantities?.spaces ?? []).map((space) => (
                      <tr key={space.id}>
                        <td>{space.space_name}</td>
                        <td className="cell-muted">{space.room_type.replace(/_/g, " ")}</td>
                        <td className="cell-muted">{space.length_m} × {space.width_m} × {space.height_m} m</td>
                        <td className="cell-muted">
                          {Math.round(space.length_m * space.width_m * Math.max(1, space.quantity ?? 1) * 10) / 10} m²
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3>Materials</h3>
                <table className="table">
                  <thead>
                    <tr><th>Material</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {(detail.snapshot?.items ?? []).map((line) => (
                      <tr key={`${line.name}-${line.quantity}`}>
                        <td>{line.name}</td>
                        <td className="cell-muted">{line.quantity} {line.unit === "No." ? "pcs" : line.unit}</td>
                        <td className="cell-muted">{line.priceGhs == null ? "Pending" : money(line.priceGhs)}</td>
                        <td>{line.priceGhs == null ? "—" : money(line.priceGhs * line.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {detail.snapshot?.quantities?.specialLoads?.length ? (
                  <>
                    <h3>Special loads</h3>
                    <p className="cell-muted">
                      {detail.snapshot.quantities.specialLoads.join(", ").replace(/_/g, " ")} — concluded by phone or WhatsApp.
                    </p>
                  </>
                ) : null}
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
