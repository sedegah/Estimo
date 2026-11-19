import Link from "next/link";
import { CATALOGUE_MATERIALS } from "@/lib/data/catalogue";
import { getCatalogueData, materialImageUrl } from "@/lib/api/catalogue-prices";
import { materialUnitLabel } from "@/lib/format";
import type { CatalogueMaterial } from "@/lib/types";
import { CatalogueQuantityControl } from "./catalogue-quantity-control";
import { CatalogueSummaryBar } from "./catalogue-summary-bar";

const FILTERS: { id: string; label: string; categories: string[] }[] = [
  { id: "all", label: "All", categories: [] },
  { id: "cables", label: "Cables", categories: ["CAT-CAB"] },
  { id: "sockets", label: "Sockets and switches", categories: ["CAT-SWS"] },
  { id: "lighting", label: "Lighting", categories: ["CAT-LGT"] },
  { id: "breakers", label: "Breakers and boards", categories: ["CAT-PRO", "CAT-DB"] },
  { id: "conduit", label: "Conduit and fittings", categories: ["CAT-CON", "CAT-TRK"] },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/mm²/g, "mm")
    .replace(/mm2/g, "mm")
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const aliases: Array<[RegExp, string]> = [
  [/\bwire\b/g, "cable"],
  [/\bsocket outlet(s)?\b/g, "socket"],
  [/\bdouble outlet(s)?\b/g, "double socket"],
  [/\bdistribution board\b/g, "db"],
  [/\bcircuit breaker\b/g, "mcb"],
  [/\bground rod\b/g, "earth rod"],
  [/\bpvc pipe\b/g, "conduit"],
];

function scoreMaterial(material: CatalogueMaterial, rawQuery: string): number {
  let query = normalize(rawQuery);
  for (const [pattern, replacement] of aliases) query = query.replace(pattern, replacement);
  const tokens = query.split(" ").filter((token) => token.length > 1);
  if (!tokens.length) return 0;

  const name = normalize(material.name);
  const spec = normalize(material.spec);
  const category = normalize(material.category);
  const keywords = normalize(material.keywords.join(" "));
  const isAccessory = /bend|coupler|saddle|clamp|inspection box|bracket|gland|lug|tape/.test(name);

  let score = 0;
  for (const token of tokens) {
    if (name.includes(token)) score += 100;
    if (keywords.includes(token)) score += 70;
    if (spec.includes(token)) score += 55;
    if (category.includes(token)) score += 35;
  }
  if (name.includes(query)) score += 220;
  if (tokens.includes("conduit") && name.includes("conduit") && !isAccessory) score += 260;
  if (tokens.includes("conduit") && isAccessory) score -= 140;
  if (tokens.includes("socket") && name.includes("socket") && !isAccessory) score += 200;
  if (isAccessory) score -= 60;
  for (const token of tokens.filter((value) => /\d/.test(value))) {
    if (name.includes(token)) score += 90;
    if (spec.includes(token)) score += 60;
  }
  return score;
}

const POPULAR_ORDER = [
  "2.5mm² copper single-core cable",
  "13a double switched socket outlet",
  "1-gang 1-way light switch",
  "20mm heavy-gauge pvc conduit",
  "32a single-pole mcb",
  "12-way",
  "earth rod",
];

const popularity = (material: CatalogueMaterial) => {
  const name = material.name.toLowerCase();
  const index = POPULAR_ORDER.findIndex((fragment) => name.includes(fragment));
  return index === -1 ? POPULAR_ORDER.length : index;
};

const filterHref = (id: string, term: string) => {
  const params = new URLSearchParams();
  if (term) params.set("q", term);
  if (id !== "all") params.set("cat", id);
  const suffix = params.toString();
  return suffix ? `/catalogue?${suffix}` : "/catalogue";
};

/** Simple line drawing that stands in for a photo. */
function CategoryGlyph({ categoryCode }: { categoryCode: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (categoryCode === "CAT-CAB") {
    return (
      <svg viewBox="0 0 32 32" width="56" height="56" aria-hidden="true" {...common}>
        <path d="M4 22c6 0 6-12 12-12s6 12 12 12" />
        <circle cx="4" cy="22" r="1.5" />
        <circle cx="28" cy="22" r="1.5" />
      </svg>
    );
  }
  if (categoryCode === "CAT-SWS") {
    return (
      <svg viewBox="0 0 32 32" width="56" height="56" aria-hidden="true" {...common}>
        <rect x="5" y="5" width="22" height="22" rx="5" />
        <path d="M12 12v3M20 12v3M16 21v1" />
      </svg>
    );
  }
  if (categoryCode === "CAT-LGT") {
    return (
      <svg viewBox="0 0 32 32" width="56" height="56" aria-hidden="true" {...common}>
        <rect x="7" y="4" width="18" height="24" rx="4" />
        <path d="M16 10v6" />
      </svg>
    );
  }
  if (categoryCode === "CAT-PRO" || categoryCode === "CAT-DB") {
    return (
      <svg viewBox="0 0 32 32" width="56" height="56" aria-hidden="true" {...common}>
        <path d="M18 3 7 18h8l-1 11 11-15h-8z" />
      </svg>
    );
  }
  if (categoryCode === "CAT-CON" || categoryCode === "CAT-TRK") {
    return (
      <svg viewBox="0 0 32 32" width="56" height="56" aria-hidden="true" {...common}>
        <rect x="3" y="12" width="26" height="8" rx="4" />
        <path d="M10 12v8M22 12v8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" width="56" height="56" aria-hidden="true" {...common}>
      <rect x="5" y="5" width="22" height="22" rx="5" />
      <path d="M11 16h10M16 11v10" />
    </svg>
  );
}

/** Material search + price cards. Used by the public catalogue and the in-app catalogue. */
export async function CatalogueView({
  q = "",
  cat = "all",
  page = 1,
  showHeader = true,
}: {
  q?: string;
  cat?: string;
  page?: number;
  showHeader?: boolean;
}) {
  const { prices, images } = await getCatalogueData();
  const term = q.trim().slice(0, 100);
  const filter = FILTERS.find((entry) => entry.id === cat) ?? FILTERS[0];

  /** Cards show the amount and, where it matters, the basis underneath. */
  const priceOf = (material: CatalogueMaterial) => {
    const entry = prices[material.id];
    if (!entry) return null;
    const amount = `GHS ${entry.price.toLocaleString("en-GH", {
      minimumFractionDigits: Number.isInteger(entry.price) ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
    const basis = material.unit === "No." ? "" : materialUnitLabel(material.unit);
    return { entry, amount, basis };
  };

  const inFilter = CATALOGUE_MATERIALS.filter(
    (material) => !filter.categories.length || filter.categories.includes(material.categoryCode),
  );

  const matched = term
    ? inFilter
        .map((material) => ({ material, score: scoreMaterial(material, term) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score || a.material.name.localeCompare(b.material.name))
        .map((row) => row.material)
    : [...inFilter].sort((a, b) => popularity(a) - popularity(b) || a.name.localeCompare(b.name));

  // chips count what the current search would show in each group
  const searchPool = term
    ? CATALOGUE_MATERIALS.map((material) => ({ material, score: scoreMaterial(material, term) }))
        .filter((row) => row.score > 0)
        .map((row) => row.material)
    : CATALOGUE_MATERIALS;
  const countFor = (entry: (typeof FILTERS)[number]) =>
    entry.categories.length
      ? searchPool.filter((material) => entry.categories.includes(material.categoryCode)).length
      : searchPool.length;

  const pageSize = 40;
  const pageCount = Math.max(1, Math.ceil(matched.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const results = matched.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    if (cat !== "all") params.set("cat", cat);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/catalogue?${query}` : "/catalogue";
  };

  return (
    <>
      {showHeader ? (
        <header className="catalogue-head">
          <div className="catalogue-head-copy">
            <span className="catalogue-eyebrow">Material prices</span>
            <h1>Check material prices</h1>
            <p>Search the catalogue for current prices before you start an estimate.</p>
          </div>
          <span className="catalogue-currency"><i aria-hidden="true" />Prices in Ghana cedis (GHS)</span>
        </header>
      ) : null}

      <form className="catalogue-search" method="get" action="/catalogue">
        {filter.id !== "all" ? <input type="hidden" name="cat" value={filter.id} /> : null}
        <label htmlFor="material-search">Search materials</label>
        <div className="catalogue-search-field">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            id="material-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="For example: 2.5 mm cable, 13 A socket"
            autoComplete="off"
          />
        </div>
      </form>

      <div className="catalogue-chips" role="group" aria-label="Filter by category">
        {FILTERS.map((entry) => {
          const active = entry.id === filter.id;
          return (
            <Link
              key={entry.id}
              className={active ? "catalogue-chip is-active" : "catalogue-chip"}
              aria-pressed={active}
              href={filterHref(entry.id, term)}
            >
              <span>{entry.label}</span>
              <span className="catalogue-chip-count">{countFor(entry)}</span>
            </Link>
          );
        })}
      </div>

      <p className="catalogue-result" aria-live="polite">
        {matched.length === 1 ? "1 material" : `${matched.length} materials`}
        {matched.length > pageSize ? ` · showing ${(currentPage - 1) * pageSize + 1}–${(currentPage - 1) * pageSize + results.length}` : ""}
      </p>

      {results.length ? (
        <ul className="catalogue-grid">
          {results.map((material) => {
            const price = priceOf(material);
            const photo = materialImageUrl(images[material.id]);
            return (
              <li key={material.id}>
                <article className="catalogue-card">
                  <div className="catalogue-card-media">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt={material.name} loading="lazy" decoding="async" />
                    ) : (
                      <CategoryGlyph categoryCode={material.categoryCode} />
                    )}
                  </div>

                  <span className="catalogue-card-brand">{price?.entry.brand ?? "Brand TBC"}</span>

                  <div className="catalogue-card-copy">
                    <span className="catalogue-card-category">{material.category}</span>
                    <Link className="catalogue-card-name" href={`/catalogue/${material.id}`}>{material.name}</Link>
                  </div>

                  <div className="catalogue-card-foot">
                    <div className="catalogue-card-price">
                      {price ? (
                        <>
                          <strong>{price.amount}</strong>
                          {price.basis ? <span>{price.basis}</span> : null}
                        </>
                      ) : (
                        <>
                          <strong className="is-pending">Price pending</strong>
                          <span>We will confirm this price soon</span>
                        </>
                      )}
                    </div>
                    <CatalogueQuantityControl
                      item={{
                        materialId: material.id,
                        name: material.name,
                        category: material.category,
                        unit: material.unit,
                        priceGhs: price?.entry.price ?? null,
                        brandName: price?.entry.brand ?? null,
                        supplierName: price?.entry.source ?? null,
                        verifiedAt: price?.entry.updatedAt ?? null,
                      }}
                    />
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="catalogue-empty">
          <strong>No materials match that search</strong>
          <p>Try a shorter term, such as “cable” or “socket”, or switch back to All categories.</p>
          <Link className="catalogue-empty-cta" href="/catalogue">Clear search</Link>
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="pager" aria-label="Catalogue pages">
          {currentPage > 1 ? <Link className="pager-btn" href={pageHref(currentPage - 1)}>Previous</Link> : <span className="pager-btn is-disabled">Previous</span>}
          <span className="pager-info">Page {currentPage} of {pageCount}</span>
          {currentPage < pageCount ? <Link className="pager-btn" href={pageHref(currentPage + 1)}>Next</Link> : <span className="pager-btn is-disabled">Next</span>}
        </nav>
      ) : null}

      <CatalogueSummaryBar />
    </>
  );
}
