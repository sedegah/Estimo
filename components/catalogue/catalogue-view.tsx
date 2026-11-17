import Link from "next/link";
import { AddToEstimateButton } from "@/components/estimate/add-to-estimate";
import { CATALOGUE_MATERIALS } from "@/lib/data/catalogue";
import type { CatalogueMaterial } from "@/lib/types";
import { getLivePrices } from "@/lib/api/catalogue-prices";

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

const unitLabel = (material: CatalogueMaterial) => {
  switch (material.unit) {
    case "m": return "per metre";
    case "No.": return "each";
    case "length": return "per length";
    default: return `per ${material.unit.toLowerCase()}`;
  }
};

const filterHref = (id: string, term: string) => {
  const params = new URLSearchParams();
  if (term) params.set("q", term);
  if (id !== "all") params.set("cat", id);
  const suffix = params.toString();
  return suffix ? `/catalogue?${suffix}` : "/catalogue";
};

/** Material search + results table. Used by the public catalogue and the in-app catalogue. */
export async function CatalogueView({ q = "", cat = "all", page = 1 }: { q?: string; cat?: string; page?: number }) {
  const livePrices = await getLivePrices();
  const term = q.trim().slice(0, 100);
  const filter = FILTERS.find((entry) => entry.id === cat) ?? FILTERS[0];

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
      <form className="price-search" method="get" action="/catalogue">
        {filter.id !== "all" ? <input type="hidden" name="cat" value={filter.id} /> : null}
        <label className="price-search-label" htmlFor="material-search">Search materials</label>
        <input
          id="material-search"
          name="q"
          defaultValue={q}
          placeholder="For example: 2.5 mm cable, 13 A socket"
          autoComplete="off"
        />
      </form>

      <div className="chip-row" aria-label="Material categories">
        {FILTERS.map((entry) => (
          <Link key={entry.id} className={entry.id === filter.id ? "chip is-active" : "chip"} href={filterHref(entry.id, term)}>
            {entry.label}
          </Link>
        ))}
      </div>

      <section className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Unit</th>
              <th>Price</th>
              <th aria-label="Add to estimate" />
            </tr>
          </thead>
          <tbody>
            {results.map((material) => (
              <tr key={material.id}>
                <td>
                  <Link className="table-link" href={`/catalogue/${material.id}`}>{material.name}</Link>
                </td>
                <td className="muted-cell">{unitLabel(material)}</td>
                <td className="muted-cell">{typeof livePrices[material.id] === "number" ? `GHS ${livePrices[material.id].toLocaleString("en-GH")}` : "Pending"}</td>
                <td className="table-action">
                  <AddToEstimateButton
                    variant="outline"
                    label="Add"
                    item={{
                      materialId: material.id,
                      name: material.name,
                      category: material.category,
                      unit: material.unit,
                      priceGhs: livePrices[material.id] ?? null,
                      brandName: null,
                      supplierName: null,
                      verifiedAt: null,
                    }}
                  />
                </td>
              </tr>
            ))}
            {!results.length ? (
              <tr>
                <td colSpan={4} className="table-empty">
                  No materials match that search. Try a simpler term such as <b>cable</b>, <b>socket</b> or <b>conduit</b>.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <nav className="pager" aria-label="Catalogue pages">
        {currentPage > 1 ? <Link className="pager-btn" href={pageHref(currentPage - 1)}>Previous</Link> : <span className="pager-btn is-disabled">Previous</span>}
        <span className="pager-info">Page {currentPage} of {pageCount}</span>
        {currentPage < pageCount ? <Link className="pager-btn" href={pageHref(currentPage + 1)}>Next</Link> : <span className="pager-btn is-disabled">Next</span>}
      </nav>

      <p className="page-note">
        {matched.length ? `Showing ${(currentPage - 1) * pageSize + 1}–${(currentPage - 1) * pageSize + results.length} of ${matched.length}` : "No"} material{matched.length === 1 ? "" : "s"}. Prices are published from the ESTIMO catalogue.
      </p>
    </>
  );
}
