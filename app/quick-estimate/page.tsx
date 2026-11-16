"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  FITTINGS,
  PROJECT_LABELS,
  computeEstimate,
  defaultCounts,
  projectType,
  totalSpaces,
  type Counts,
  type FittingQuality,
  type SpaceItem,
} from "@/lib/estimate-model";
import { formatGhs } from "@/lib/format";
import { saveEstimate } from "@/lib/storage/saved-estimates";
import { saveDraft } from "@/lib/storage/draft";

const clampRoom = (value: number) => Math.max(0, Math.min(20, Math.round(value)));

const itemQuantity = (item: SpaceItem) =>
  item.lights ?? item.sockets ?? item.acs ?? item.heaters ?? item.switches ?? item.cooking ?? 0;

function ProjectTypeSelect({ template, onChange }: { template: string; onChange: (value: string) => void }) {
  return (
    <div className="setup-project">
      <label htmlFor="project-type">Project type</label>
      <select id="project-type" value={template} onChange={(event) => onChange(event.target.value)}>
        {Object.entries(PROJECT_LABELS).map(([code, name]) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
    </div>
  );
}

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = searchParams.get("template") || "HOME-2B";
  const type = projectType(template);

  const initialCounts = (): Counts => {
    const defaults = defaultCounts(type.code);
    const next: Counts = { ...defaults };
    for (const field of type.fields) {
      const raw = searchParams.get(field.key);
      if (raw !== null && raw !== "") next[field.key] = clampRoom(Number(raw));
    }
    return next;
  };

  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [quality, setQuality] = useState<FittingQuality>(
    (searchParams.get("quality") as FittingQuality) || "standard",
  );
  const [openSpaces, setOpenSpaces] = useState<string[]>(() =>
    (searchParams.get("open") ?? "").split(",").filter(Boolean),
  );
  const [saved, setSaved] = useState(false);
  const lastTemplate = useRef(type.code);

  useEffect(() => {
    if (lastTemplate.current === type.code) return;
    lastTemplate.current = type.code;
    setCounts(defaultCounts(type.code));
    setSaved(false);
  }, [type.code]);

  // Keep a resumable draft of the current setup.
  useEffect(() => {
    saveDraft({ template: type.code, counts, quality });
  }, [type.code, counts, quality]);

  const total = computeEstimate(type.code, counts, quality);
  const fittingsLabel = FITTINGS.find((entry) => entry.value === quality)?.label ?? "Standard";
  const spaces = totalSpaces(counts);

  const estimateQuery = () => {
    const params = new URLSearchParams({ template: type.code, quality });
    for (const field of type.fields) params.set(field.key, String(counts[field.key] ?? 0));
    return `/estimate?${params.toString()}`;
  };

  const changeSpace = (key: string, delta: number) => {
    setCounts((current) => ({ ...current, [key]: clampRoom((current[key] ?? 0) + delta) }));
  };

  const toggleSpace = (key: string) => {
    setOpenSpaces((current) => (current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]));
  };

  const saveForLater = () => {
    saveEstimate({
      name: `${type.label} estimate`,
      kind: "quick",
      detail: `${type.label} · ${fittingsLabel} fittings · ${spaces} spaces`,
      totalGhs: total,
    });
    setSaved(true);
  };

  return (
    <main className="container page-shell">
      <div className="setup-layout">
        <div>
          <Link className="back-link" href="/">Back to project types</Link>
          <h1 className="page-title">Set up your {type.label.toLowerCase()}</h1>
          <p className="page-sub">These are starting points. Change anything that does not match your plan.</p>

          <ProjectTypeSelect template={type.code} onChange={(value) => router.push(`/quick-estimate?template=${value}`)} />

          <section className="setup-section">
            <h2 className="section-title">Spaces</h2>
            {type.fields.map((field) => {
              const open = openSpaces.includes(field.key);
              const count = counts[field.key] ?? 0;
              return (
                <div className={open ? "room-block is-open" : "room-block"} key={field.key}>
                  <div className="room-row">
                    <button
                      className="room-trigger"
                      type="button"
                      aria-expanded={open}
                      onClick={() => toggleSpace(field.key)}
                    >
                      <span className="room-copy">
                        <strong>{field.label}</strong>
                        <span>{field.note}</span>
                      </span>
                      <svg className="room-chevron" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true">
                        <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div className="stepper">
                      <button type="button" onClick={() => changeSpace(field.key, -1)} aria-label={`Fewer ${field.label}`}>−</button>
                      <span aria-live="polite">{count}</span>
                      <button type="button" onClick={() => changeSpace(field.key, 1)} aria-label={`More ${field.label}`}>+</button>
                    </div>
                  </div>
                  {open ? (
                    <div className="room-panel">
                      {count > 0 ? (
                        <>
                          <p className="room-panel-note">
                            {count} × {field.label.toLowerCase()} included
                          </p>
                          <ul className="room-panel-list">
                            {field.items.map((item) => {
                              const quantity = itemQuantity(item) * count;
                              return (
                                <li key={item.name}>
                                  <span>{item.name}</span>
                                  <strong>
                                    {quantity} <small>{item.unit}{quantity === 1 ? "" : "s"}</small>
                                  </strong>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      ) : (
                        <p className="room-panel-note">No {field.label.toLowerCase()} in this estimate yet.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>

          <section className="setup-section">
            <h2 className="section-title">Quality of fittings</h2>
            <div className="option-grid">
              {FITTINGS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={quality === option.value ? "option-card is-active" : "option-card"}
                  onClick={() => setQuality(option.value)}
                  aria-pressed={quality === option.value}
                >
                  <strong>{option.label}</strong>
                  <span>{option.note}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="side-card">
          <h2 className="side-title">Your estimate so far</h2>
          <dl className="side-rows">
            <div><dt>Project</dt><dd>{type.label}</dd></div>
            <div><dt>Spaces</dt><dd>{spaces}</dd></div>
            <div><dt>Fittings</dt><dd>{fittingsLabel}</dd></div>
          </dl>
          <div className="side-divider" />
          <span className="side-label">Estimated total</span>
          <strong className="side-total">{formatGhs(total, 0)}</strong>
          <p className="side-note">Updates as you change the spaces.</p>
          <button className="btn-amber side-cta" type="button" onClick={() => router.push(estimateQuery())}>
            See estimate
          </button>
          {saved ? (
            <Link className="link-button side-link" href="/projects">Saved — view saved projects</Link>
          ) : (
            <button className="link-button side-link" type="button" onClick={saveForLater}>Save for later</button>
          )}
          <p className="side-fineprint">Illustrative preliminary estimate, not a live supplier price.</p>
        </aside>
      </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<main className="container page-shell"><p className="page-sub">Loading setup…</p></main>}>
      <SetupContent />
    </Suspense>
  );
}

