"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import {
  FITTINGS,
  computeEstimate,
  defaultCounts,
  estimateLines,
  projectType,
  type Counts,
  type FittingQuality,
} from "@/lib/estimate-model";
import { formatGhs } from "@/lib/format";
import { saveEstimate } from "@/lib/storage/saved-estimates";
import { pushCreate } from "@/lib/api/estimates";

const number = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

function EstimateContent() {
  const searchParams = useSearchParams();
  const template = searchParams.get("template") || "HOME-2B";
  const type = projectType(template);
  const quality = (searchParams.get("quality") as FittingQuality) || "standard";

  const counts: Counts = useMemo(() => {
    const defaults = defaultCounts(type.code);
    const next: Counts = { ...defaults };
    for (const field of type.fields) {
      const raw = searchParams.get(field.key);
      if (raw !== null && raw !== "") next[field.key] = number(raw, defaults[field.key] ?? 0);
    }
    return next;
  }, [searchParams, type]);

  const fittingsLabel = FITTINGS.find((entry) => entry.value === quality)?.label ?? "Standard";
  const total = computeEstimate(type.code, counts, quality);
  const lines = estimateLines(total, type.code, counts);
  const [saved, setSaved] = useState(false);

  const saveProject = () => {
    const saved = saveEstimate({
      name: `${type.label} estimate`,
      kind: "quick",
      detail: `${type.label} · ${fittingsLabel} fittings`,
      totalGhs: total,
      template: type.code,
      counts,
      quality,
      items: lines.map((line) => ({
        name: line.label,
        quantity: Number.parseInt(line.quantity, 10) || 1,
        unit: line.quantity.replace(/^\d+\s*/, "") || "lot",
      })),
    });
    void pushCreate(saved);
    setSaved(true);
  };

  const pdfHref = () => {
    const params = new URLSearchParams({ template: type.code, quality, name: `${type.label} estimate` });
    for (const field of type.fields) params.set(field.key, String(counts[field.key] ?? 0));
    return `/api/estimates/pdf?${params.toString()}`;
  };

  const adjustHref = () => {
    const params = new URLSearchParams({ template: type.code, quality });
    for (const field of type.fields) params.set(field.key, String(counts[field.key] ?? 0));
    return `/quick-estimate?${params.toString()}`;
  };

  return (
    <main className="container page-shell estimate-page">
      <header className="estimate-head">
        <div>
          <h1 className="page-title">Your estimate</h1>
          <p className="page-sub">{type.label}, {fittingsLabel} fittings.</p>
        </div>
        <div className="estimate-actions">
          <button className="btn-amber" type="button" onClick={saveProject}>
            {saved ? "Saved" : "Save project"}
          </button>
          <a className="btn-outline" href={pdfHref()}>Download PDF</a>
          <Link className="link-button" href={adjustHref()}>Adjust details</Link>
        </div>
      </header>

      <section className="estimate-summary">
        <div>
          <span className="estimate-summary-label">Estimated total</span>
          <strong className="estimate-summary-total">{formatGhs(total, 0)}</strong>
        </div>
        <p>Materials and labour. Prices come from the Catalogue and can change before you buy.</p>
      </section>

      <section className="table-card estimate-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit price</th>
              <th className="align-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.label}>
                <td>{line.label}</td>
                <td className="muted-cell">{line.quantity}</td>
                <td className="muted-cell">{formatGhs(line.unitPrice, 0)}</td>
                <td className="align-right">{formatGhs(line.amount, 0)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>Total</td>
              <td />
              <td />
              <td className="align-right">{formatGhs(total, 0)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <ul className="estimate-lines">
        {lines.map((line) => (
          <li className="estimate-line" key={line.label}>
            <span className="estimate-line-name">{line.label}</span>
            <span className="estimate-line-amount">{formatGhs(line.amount, 0)}</span>
            <span className="estimate-line-meta">
              {line.quantity} · {formatGhs(line.unitPrice, 0)} each
            </span>
          </li>
        ))}
        <li className="estimate-line is-total">
          <span className="estimate-line-name">Total</span>
          <span className="estimate-line-amount">{formatGhs(total, 0)}</span>
        </li>
      </ul>

      <p className="page-note">
        Illustrative preliminary estimate for calibration. It is not a quotation and not a verified market price;
        electrical design and final quantities remain subject to site verification.
      </p>
    </main>
  );
}

export default function EstimatePage() {
  return (
    <Suspense fallback={<main className="container page-shell"><p className="page-sub">Loading estimate…</p></main>}>
      <EstimateContent />
    </Suspense>
  );
}
