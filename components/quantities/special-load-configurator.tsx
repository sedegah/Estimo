import { formatGhs } from "@/lib/format";
"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  STATUS_LABEL,
  configurationStatus,
  missingRequirements,
  sizeSpecialLoad,
  specialLoadDefinition,
  specialLoadMaterials,
  type SpecialLoadField,
  type SpecialLoadFieldKey,
  type SpecialLoadInstance,
  type SpecialLoadValues,
  type SizingSource,
} from "@/lib/quantity-engine/special-loads";


interface Props {
  instance: SpecialLoadInstance;
  /** Boards the circuit can leave from, labelled for the plan. */
  boards: { value: string; label: string }[];
  /** Spaces the load can serve, labelled for the plan. */
  spaces: { value: string; label: string }[];
  /** The ESTIMO distance to a space, when the published route table knows one. */
  routeForSpace: (spaceId: string | null) => number | null;
  /** Priced cost of this load's materials, and how many lines have no price yet. */
  cost: { total: number; unpriced: number } | null;
  /**
   * When the plan already decides the quantity (air conditioners counted in the Points
   * table), this is that count and the quantity field becomes read-only.
   */
  lockedQuantity?: number;
  onApply: (next: SpecialLoadInstance) => void;
  onRemove: () => void;
  onClose: () => void;
}

const GROUP_TITLE: Record<SpecialLoadField["group"], string> = {
  load: "The load",
  route: "Route from the board",
  manufacturer: "Manufacturer requirements",
  notes: "Notes",
};

const GROUP_HINT: Record<SpecialLoadField["group"], string> = {
  load: "What the plate says. These figures decide the circuit.",
  route: "Where the circuit runs and how it is installed.",
  manufacturer: "Only if the manual states them. They override ESTIMO's sizing.",
  notes: "Anything the next person needs to know.",
};

const SOURCES: { value: SizingSource; label: string; hint: string }[] = [
  {
    value: "ESTIMO_PROVISIONAL",
    label: "ESTIMO provisional sizing",
    hint: "The rating and route are known; the manufacturer's requirements are not.",
  },
  {
    value: "MANUFACTURER",
    label: "Manufacturer instructions",
    hint: "The cable, breaker or RCD come from the installation manual.",
  },
  {
    value: "USER_OVERRIDE",
    label: "My professional judgement",
    hint: "A qualified person has decided the circuit; the estimate says so.",
  },
];

/** The configurator prints amounts in the display currency, like the bill. */
const money = (value: number) => formatGhs(value, 2);

const manufacturerField = (key: SpecialLoadFieldKey) =>
  key === "manufacturer_cable_size_mm2" || key === "manufacturer_breaker_rating_a";

/**
 * The special-load configurator.
 *
 * One modal, rendered from the load definition: the fields, the presets and the cautions
 * all come from lib/quantity-engine/special-loads, so a new load type needs no new form.
 * Applying is deliberate: nothing reaches the estimate until the person presses the
 * button, and a load that is still incomplete is saved as "configuration required"
 * rather than as a silent zero.
 */
export function SpecialLoadConfigurator({
  instance,
  boards,
  spaces,
  routeForSpace,
  cost,
  lockedQuantity,
  onApply,
  onRemove,
  onClose,
}: Props) {
  const [draft, setDraft] = useState<SpecialLoadInstance>(instance);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  const definition = useMemo(() => specialLoadDefinition(instance.load_key), [instance.load_key]);
  const status = configurationStatus(draft);
  const missing = missingRequirements(draft);
  const sizing = missing.length ? null : sizeSpecialLoad(draft);
  const autoRouteM = routeForSpace(draft.target_space_id);
  const materialLines = missing.length ? [] : specialLoadMaterials(draft, autoRouteM ?? 8);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const first = dialogRef.current?.querySelector<HTMLElement>("button, input, select, textarea");
    first?.focus();
  }, []);

  const patch = (values: Partial<SpecialLoadValues>) => setDraft((current) => ({ ...current, ...values }));

  const setField = (field: SpecialLoadField, raw: string) => {
    const key = field.key;

    if (field.kind === "number") {
      if (raw.trim() === "") {
        if (key === "quantity") patch({ quantity: 1 });
        else if (key === "route_length_m") patch({ route_length_m: null });
        else patch({ [key]: null } as Partial<SpecialLoadValues>);
        return;
      }
      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) return;

      if (key === "quantity") patch({ quantity: Math.max(1, Math.round(numeric)) });
      else if (key === "route_length_m") {
        patch({ route_length_m: Math.max(0.5, numeric), route_source: "USER_OVERRIDE" });
      } else {
        patch({ [key]: numeric } as Partial<SpecialLoadValues>);
      }
      return;
    }

    if (key === "local_isolator_required" || key === "dedicated_circuit") {
      // both are stored as boolean | null, and both are edited through a yes/no select
      patch({ [key]: raw === "yes" ? true : raw === "no" ? false : null } as Partial<SpecialLoadValues>);
      return;
    }

    if (key === "manufacturer_rcd_requirement") {
      const value = raw === "required" || raw === "not_required" ? raw : "unknown";
      patch({ manufacturer_rcd_requirement: value });
      return;
    }

    if (key === "manufacturer_cable_size_mm2") {
      patch({ manufacturer_cable_size_mm2: raw === "" ? null : Number(raw) });
      return;
    }

    if (key === "manufacturer_breaker_rating_a") {
      patch({ manufacturer_breaker_rating_a: raw === "" ? null : Number(raw) });
      return;
    }

    if (key === "phase") {
      patch({ phase: raw === "three" ? "three" : "single" });
      return;
    }

    if (key === "installation_method") {
      const method = raw === "trunking" || raw === "surface" || raw === "concealed" ? raw : "conduit";
      patch({ installation_method: method });
      return;
    }

    if (key === "serving_db_id") {
      patch({ serving_db_id: raw || null });
      return;
    }

    if (key === "target_space_id") {
      // choosing the space re-reads the ESTIMO distance, unless a person typed one
      const spaceId = raw || null;
      const distance = routeForSpace(spaceId);
      patch(
        draft.route_source === "AUTO"
          ? { target_space_id: spaceId, route_length_m: distance }
          : { target_space_id: spaceId },
      );
      return;
    }

    patch({ [key]: raw } as Partial<SpecialLoadValues>);
  };

  const valueOf = (field: SpecialLoadField): string => {
    const value = draft[field.key as keyof SpecialLoadValues];
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "yes" : "no";
    return String(value);
  };

  const optionsFor = (field: SpecialLoadField) => {
    if (field.optionsFrom === "boards") {
      const options = boards.length ? boards : [{ value: "DB1", label: "Main board (DB1)" }];
      const known = options.some((option) => option.value === draft.serving_db_id);
      return known || !draft.serving_db_id
        ? options
        : [...options, { value: draft.serving_db_id, label: draft.serving_db_id }];
    }
    if (field.optionsFrom === "spaces") {
      const options = [{ value: "", label: "Not assigned to a space" }, ...spaces];
      const known = options.some((option) => option.value === (draft.target_space_id ?? ""));
      return known || !draft.target_space_id
        ? options
        : [...options, { value: draft.target_space_id, label: draft.target_space_id }];
    }
    return field.options ?? [];
  };

  const apply = () => {
    // A person who filled the manufacturer boxes meant them to count.
    const manufacturerFilled =
      draft.manufacturer_cable_size_mm2 !== null || draft.manufacturer_breaker_rating_a !== null;
    onApply({
      ...draft,
      // the plan owns the count when it has one (ACs counted in Points), so applying the
      // form can never quietly drop it back to one
      quantity: lockedQuantity ?? draft.quantity,
      sizing_source:
        manufacturerFilled && draft.sizing_source === "ESTIMO_PROVISIONAL"
          ? "MANUFACTURER"
          : draft.sizing_source,
    });
  };

  const groups = (["load", "route", "manufacturer", "notes"] as const)
    .map((group) => ({ group, fields: definition.fields.filter((entry) => entry.group === group) }))
    .filter((entry) => entry.fields.length > 0);

  const statusClass = status.toLowerCase().replace(/_/g, "-");

  return (
    <div
      className="load-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="load-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <header className="load-dialog-head">
          <div>
            <p className="load-dialog-kicker">
              {definition.spaceContext === "external" ? "compound" : definition.spaceContext.replace(/_/g, " ")}
            </p>
            <h2 id={titleId}>{definition.name}</h2>
            <p className="load-dialog-tagline">{definition.tagline}</p>
          </div>
          <button type="button" className="load-dialog-close" onClick={onClose} aria-label="Close the configurator">
            ×
          </button>
        </header>

        <div className="load-dialog-body">
          {definition.presets.length > 1 ? (
            <section className="load-dialog-section" aria-label="Common sizes">
              <h3>Common sizes</h3>
              <div className="load-presets">
                {definition.presets.map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    className={draft.preset_code === preset.code ? "load-preset is-active" : "load-preset"}
                    onClick={() =>
                      setDraft((current) => ({ ...current, ...preset.values, preset_code: preset.code }))
                    }
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {groups.map(({ group, fields }) => (
            <section className="load-dialog-section" key={group}>
              <h3>{GROUP_TITLE[group]}</h3>
              <p className="load-dialog-hint">{GROUP_HINT[group]}</p>
              <div className="load-fields">
                {fields.map((field) => (
                  <label
                    key={field.key}
                    className={field.kind === "textarea" ? "load-field is-wide" : "load-field"}
                    htmlFor={`${titleId}-${field.key}`}
                  >
                    <span className="load-field-label">
                      {field.label}
                      {field.unit ? <em>{field.unit}</em> : null}
                      {definition.required.includes(field.key) ? <i className="load-required">required</i> : null}
                    </span>

                    {field.key === "quantity" && lockedQuantity !== undefined ? (
                      // the plan already counts these; typing a number here would contradict it
                      <p className="load-locked">
                        <strong>{lockedQuantity}</strong> air conditioner{lockedQuantity === 1 ? "" : "s"} counted
                        in the Points table.
                      </p>
                    ) : field.kind === "textarea" ? (
                      <textarea
                        id={`${titleId}-${field.key}`}
                        rows={2}
                        placeholder={field.placeholder}
                        value={valueOf(field)}
                        onChange={(event) => setField(field, event.target.value)}
                      />
                    ) : field.kind === "select" ? (
                      <select
                        id={`${titleId}-${field.key}`}
                        value={valueOf(field)}
                        onChange={(event) => setField(field, event.target.value)}
                      >
                        {manufacturerField(field.key) ? (
                          <option value="">Not stated</option>
                        ) : valueOf(field) === "" ? (
                          <option value="">Load default</option>
                        ) : null}
                        {optionsFor(field).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`${titleId}-${field.key}`}
                        type="number"
                        inputMode="decimal"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        placeholder={field.placeholder}
                        value={valueOf(field)}
                        onChange={(event) => setField(field, event.target.value)}
                      />
                    )}

                    {field.help ? <small>{field.help}</small> : null}
                  </label>
                ))}
              </div>

              {group === "route" ? (
                <button
                  type="button"
                  className="load-link"
                  onClick={() =>
                    patch({
                      route_length_m: autoRouteM,
                      route_source: "AUTO",
                    })
                  }
                  disabled={autoRouteM === null}
                >
                  Use the ESTIMO distance{autoRouteM !== null ? ` (${autoRouteM} m)` : ""}
                </button>
              ) : null}
            </section>
          ))}

          <section className="load-dialog-section">
            <h3>Where the figures come from</h3>
            <div className="load-sources" role="radiogroup" aria-label="Sizing source">
              {SOURCES.map((source) => (
                <label key={source.value} className={draft.sizing_source === source.value ? "load-source is-active" : "load-source"}>
                  <input
                    type="radio"
                    name={`${titleId}-source`}
                    value={source.value}
                    checked={draft.sizing_source === source.value}
                    onChange={() => patch({ sizing_source: source.value })}
                  />
                  <span>
                    <strong>{source.label}</strong>
                    <small>{source.hint}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="load-dialog-preview" aria-live="polite">
            <div className="load-preview-head">
              <h3>What ESTIMO will add</h3>
              <span className={`load-status is-${statusClass}`}>{STATUS_LABEL[status]}</span>
            </div>

            {sizing ? (
              <>
                <p className="load-preview-line">
                  {sizing.loadCurrentA} A load · {sizing.protectiveDeviceA} A device · {sizing.cableSizeMm2} mm² cable
                  {sizing.rcdRequired ? " · 30 mA RCD" : ""}
                  {sizing.isolatorRatingA ? ` · ${sizing.isolatorRatingA} A isolator` : ""}
                </p>
                <ul className="load-basis">
                  {sizing.basis.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="load-preview-line">
                  {materialLines.length} material line{materialLines.length === 1 ? "" : "s"} will be added to the
                  bill of quantities.
                  {cost && cost.total > 0 ? ` This load is ${money(cost.total)} in the estimate so far.` : ""}
                  {cost && cost.unpriced ? ` ${cost.unpriced} line${cost.unpriced === 1 ? " has" : "s have"} no price yet.` : ""}
                </p>
              </>
            ) : (
              <p className="load-preview-line">
                Not enough detail yet. Add {missing.map((key) => key.replace(/_/g, " ")).join(", ")} and ESTIMO can
                size the circuit.
              </p>
            )}

            {status !== "VERIFIED" ? <p className="load-caution">{definition.provisionalNote}</p> : null}
          </section>
        </div>

        <footer className="load-dialog-foot">
          <div className="load-dialog-state">
            {missing.length ? (
              <span>
                Still missing: {missing.map((key) => key.replace(/_/g, " ")).join(", ")}. It will be saved as
                “configuration required” and kept out of the total.
              </span>
            ) : (
              <span>{STATUS_LABEL[status]} — the circuit, route and materials will be added to the estimate.</span>
            )}
          </div>
          <div className="load-dialog-actions">
            <button type="button" className="btn-outline btn-small" onClick={onRemove}>
              Remove load
            </button>
            <button type="button" className="btn-outline btn-small" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-amber btn-small" onClick={apply}>
              Apply to estimate
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

