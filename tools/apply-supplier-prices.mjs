#!/usr/bin/env node
/**
 * Applies the curated supplier match map to the ESTIMO catalogue.
 *
 *   node tools/apply-supplier-prices.mjs [--feed raw.json] [--map file.json]
 *
 * Produces two things:
 *   lib/db/seed-prices-electrical-supplies.sql        catalogue_prices rows for D1
 *   docs/PRICE-MATCH-ELECTRICAL-SUPPLIES.md           what matched, what did not, and why
 *
 * Prices live in the database only Ã¢â‚¬â€ nothing is bundled into the frontend. Apply
 * the seed with tools/apply-catalogue-prices.mjs.
 *
 * Every entry pins one material to one supplier product by a unique substring of
 * the product title. The script fails if that substring is not unique, if the
 * material id is unknown, if the map's unit disagrees with the catalogue unit,
 * or if the supplier sells a different quantity than the map claims (per yard,
 * per 2 m piece, ...). A wrong unit cannot ship quietly.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const REPO = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};

const FEED_URL = "https://www.electricalsuppliesgh.com/products.json?limit=250&page=";
const MAP = flag("map") ?? path.join(REPO, "lib", "data", "supplier-price-map.json");
const OUT_SQL = path.join(REPO, "lib", "db", "seed-prices-electrical-supplies.sql");
const OUT_MD = path.join(REPO, "docs", "PRICE-MATCH-ELECTRICAL-SUPPLIES.md");

const number = (value) => (value == null || value === "" ? null : Number(value));
const round2 = (value) => Math.round(value * 100) / 100;
const quote = (value) => String(value ?? "").replace(/'/g, "''");

/** Full (pre-promotion) price for a product. */
function fullPrice(product) {
  const variant = product.variants?.[0] ?? {};
  const price = number(variant.price);
  const compare = number(variant.compare_at_price);
  return compare != null && price != null && compare > price ? compare : price;
}

const BRANDS = [
  "Schneider Electric", "Phoenix Contact", "Midea", "SUIMING", "CHINT", "UNO", "ABB", "Eaton",
  "Fluke", "WAGO", "Degson", "Siemens", "Omron", "Delta", "Ingco", "Wadfow", "Unistrut", "BINOKA",
];

/** Brand named in the title, else the storefront vendor. */
function brandOf(product) {
  const title = (product.title ?? "").toLowerCase();
  const hit = BRANDS.find((brand) => title.includes(brand.toLowerCase()));
  if (hit) return hit;
  const vendor = (product.vendor ?? "").trim();
  return !vendor || vendor.toLowerCase() === "my store" ? "Unbranded" : vendor;
}

/** What one unit of the supplier's price buys, when the title says so. */
function titleBasis(title) {
  const text = title.toLowerCase();
  if (/price per yard|per yard/.test(text)) return "per yard";
  if (/per metre|per meter/.test(text)) return "per metre";
  if (/\b2m\/pc\b|2 metre length/.test(text)) return "2 m piece";
  if (/2900 mm/.test(text)) return "2.9 m piece";
  if (/100m roll|100 m roll/.test(text)) return "100 m roll";
  return null;
}

/** Converts a supplier price into our catalogue unit. */
function toCatalogueUnit(price, convert) {
  if (price == null) return null;
  switch (convert) {
    case "yard-to-metre":
      return round2(price * 1.0936133);
    case "piece-2m-to-3m-length":
      return round2((price / 2) * 3);
    case "piece-2.9m-to-3m-length":
      return round2((price / 2.9) * 3);
    case "roll-100m-to-metre":
      return round2(price / 100);
    default:
      return round2(price);
  }
}

const CONVERSION = {
  "yard-to-metre": { from: "per yard", note: "1 yard = 0.9144 m, so x 1.0936 to price a metre" },
  "piece-2m-to-3m-length": { from: "2 m piece", note: "x 1.5 to price a 3 m length" },
  "piece-2.9m-to-3m-length": { from: "2.9 m piece", note: "x 3/2.9 to price a 3 m length" },
  "roll-100m-to-metre": { from: "100 m roll", note: "/ 100 to price a metre" },
};

async function loadFeed() {
  const input = flag("feed");
  if (input) return JSON.parse(fs.readFileSync(input, "utf8"));
  const products = [];
  for (let page = 1; page <= 60; page++) {
    const response = await fetch(`${FEED_URL}${page}`, { headers: { "User-Agent": "ESTIMO-catalogue-import/1.0" } });
    if (!response.ok) throw new Error(`page ${page} answered ${response.status}`);
    const { products: batch = [] } = await response.json();
    if (!batch.length) break;
    products.push(...batch);
    if (batch.length < 250) break;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return products;
}

function loadCatalogue() {
  const source = fs.readFileSync(path.join(REPO, "lib", "data", "catalogue.ts"), "utf8");
  const start = source.indexOf("CATALOGUE_MATERIALS");
  return JSON.parse(source.slice(source.indexOf("= [", start) + 2, source.lastIndexOf("];") + 1));
}

/** Rewrites only the CATALOGUE_MATERIALS array, leaving the rest of the file as it was. */
function writeCatalogue(materials) {
  const file = path.join(REPO, "lib", "data", "catalogue.ts");
  const source = fs.readFileSync(file, "utf8");
  const start = source.indexOf("CATALOGUE_MATERIALS");
  const open = source.indexOf("= [", start) + 2;
  const close = source.lastIndexOf("];") + 1;
  fs.writeFileSync(file, source.slice(0, open) + JSON.stringify(materials, null, 2) + source.slice(close), "utf8");
}

const [products, materials, map] = [await loadFeed(), loadCatalogue(), JSON.parse(fs.readFileSync(MAP, "utf8"))];

// New materials extend the families we already stock; they are matched and priced
// exactly like the existing ones.
const ADDITIONS = path.join(REPO, "lib", "data", "supplier-new-materials.json");
const additions = fs.existsSync(ADDITIONS) ? JSON.parse(fs.readFileSync(ADDITIONS, "utf8")) : [];
const added = [];
for (const item of additions) {
  const { match, basis, convert, confidence, note, ...definition } = item;
  const exists = materials.some((material) => material.id === item.id);
  if (!exists) {
    materials.push(definition);
    added.push(definition);
  }
  map.entries.push({ material: item.id, match, basis, convert, confidence, note, unit: definition.unit, added: true });
}
if (added.length) {
  writeCatalogue(materials);
  execFileSync(process.execPath, [path.join(REPO, "tools", "seed-catalogue.mjs")], { cwd: REPO, stdio: "inherit" });
}
const byId = new Map(materials.map((material) => [material.id, material]));
const used = new Set();
const matches = [];
const errors = [];

for (const entry of map.entries) {
  const material = byId.get(entry.material);
  if (!material) { errors.push(`unknown material ${entry.material}`); continue; }
  if (used.has(entry.material)) errors.push(`duplicate mapping for ${entry.material}`);
  used.add(entry.material);

  if (entry.unit !== material.unit) {
    errors.push(`${entry.material}: map unit "${entry.unit}" but the catalogue unit is "${material.unit}"`);
    continue;
  }

  const needle = entry.match.toLowerCase().replace(/[Ã¢â‚¬â€˜Ã¢â‚¬â€œ]/g, "-");
  const hits = products.filter((product) => product.title.toLowerCase().replace(/[Ã¢â‚¬â€˜Ã¢â‚¬â€œ]/g, "-").includes(needle));
  if (hits.length !== 1) { errors.push(`${entry.material}: "${entry.match}" matched ${hits.length} products`); continue; }

  const product = hits[0];
  const detected = titleBasis(product.title);
  const declared = CONVERSION[entry.convert]?.from ?? entry.basis;
  if (detected && detected !== declared) {
    errors.push(`${entry.material}: map says "${declared}" but the product is sold "${detected}"`);
    continue;
  }
  if (!detected && (entry.convert ?? entry.basis !== "per piece")) {
    if (entry.convert) errors.push(`${entry.material}: conversion declared but the title states no quantity`);
  }

  const supplierPrice = fullPrice(product);
  const price = toCatalogueUnit(supplierPrice, entry.convert);
  if (price == null || !(price > 0)) { errors.push(`${entry.material}: no usable price on ${product.title}`); continue; }

  matches.push({ material, entry, product, brand: brandOf(product), supplierPrice, price, variant: product.variants?.[0] ?? {} });
}

if (errors.length) {
  console.error("Cannot apply the price map:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

matches.sort((a, b) => a.material.name.localeCompare(b.material.name, "en"));
const unmatched = materials.filter((material) => !used.has(material.id));

// Ã¢â€â‚¬Ã¢â€â‚¬ D1 seed Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const sql = [
  `-- Generated by tools/apply-supplier-prices.mjs from ${map.source} (${map.sourceUrl}).`,
  `-- Full (pre-promotion) prices, read ${map.fetched}. One row per matched material.`,
  `-- Requires migration 0006 (catalogue_prices.brand).`,
  ...matches.flatMap((match) => {
    const id = `price-esg-${match.material.id.replace(/^mat-/, "")}`;
    const note = `${match.product.title}${match.entry.note ? ` Ã¢â‚¬â€ ${match.entry.note}` : ""}`;
    const row = [
      "INSERT INTO catalogue_prices (id, item_id, price_ghs, currency, source, brand, note, updated_by)",
      `VALUES ('${id}', '${match.material.id}', ${match.price.toFixed(2)}, 'GHS', '${quote(map.source)}', '${quote(match.brand)}', '${quote(note)}', 'import:electrical-supplies-gh')`,
      "ON CONFLICT(id) DO UPDATE SET price_ghs=excluded.price_ghs, source=excluded.source, brand=excluded.brand, note=excluded.note, updated_at=datetime('now');",
    ];
    return row;
  }),
  "",
];
fs.writeFileSync(OUT_SQL, sql.join("\n"), "utf8");

// Ã¢â€â‚¬Ã¢â€â‚¬ report Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const md = [];
md.push(
  "# Supplier price match Ã¢â‚¬â€ Electrical Supplies Ghana",
  "",
  `Curated on ${map.fetched} against ${products.length.toLocaleString("en-GB")} products published at`,
  `[${map.sourceUrl.replace("https://", "")}](${map.sourceUrl}/).`,
  "",
  `- Catalogue materials: **${materials.length}**`,
  `- Matched to a supplier product: **${matches.length}**`,
  `- New materials added to the catalogue: **${added.length}**`,
  `- Left without a supplier price: **${unmatched.length}**`,
  "",
  "Prices are the supplier's **full (pre-promotion) price**, converted to our catalogue unit where",
  "the supplier sells a different quantity. Each row states what the supplier's price actually buys.",
  "",
  "## Matched",
  "",
  "| Catalogue material | Unit | Price | Supplier product | Brand | Supplier basis | Confidence |",
  "| --- | --- | ---: | --- | --- | --- | --- |",
);
for (const match of matches) {
  const supplier = `[${match.product.title.replace(/\|/g, "\\|").slice(0, 70)}](${map.sourceUrl}/products/${match.product.handle})`;
  const basis = `${match.entry.basis} Ã‚Â· ${match.supplierPrice.toFixed(2)}${match.entry.convert ? ` Ã¢â€ â€™ ${CONVERSION[match.entry.convert].note}` : ""}`;
  md.push(
    `| ${match.material.name.replace(/\|/g, "\\|")} | ${match.material.unit} | ${match.price.toFixed(2)} | ${supplier} | ${match.brand} | ${basis} | ${match.entry.confidence} |`,
  );
}

const noted = matches.filter((match) => match.entry.note);
if (noted.length) {
  md.push("", "### Notes on individual matches", "");
  for (const match of noted) md.push(`- **${match.material.name}** Ã¢â‚¬â€ ${match.entry.note}.`);
}

if (added.length) {
  md.push(
    "",
    "## Added to the catalogue",
    "",
    "These sizes and variants were missing from our library but belong to families we already stock,",
    "so they were added with the supplier price:",
    "",
    "| New material | Category | Unit | Price | Supplier product |",
    "| --- | --- | --- | ---: | --- |",
  );
  for (const match of matches.filter((entry) => entry.entry.added)) {
    md.push(
      `| ${match.material.name.replace(/\|/g, "\\|")} | ${match.material.category} | ${match.material.unit} | ${match.price.toFixed(2)} | [${match.product.title.replace(/\|/g, "\\|").slice(0, 70)}](${map.sourceUrl}/products/${match.product.handle}) |`,
    );
  }
}

md.push(
  "",
  "## Not matched",
  "",
  "These materials have no equivalent on the supplier site, so their price was left alone:",
  "",
  "| Catalogue material | Unit | Why |",
  "| --- | --- | --- |",
);
const REASONS = {
  "Cables & Wires": "supplier stocks only 16Ã¢â‚¬â€œ120 mmÃ‚Â² single core (per yard); no twin & earth, flex, SWA, Cat6 or small sizes",
  "Conduit & Accessories": "no PVC conduit, bends, couplers, saddles or inspection boxes on the supplier site",
  "Trunking & Accessories": "no trunking corners, tees, joiners or 38Ãƒâ€”25 sizes",
  "Switches & Sockets": "no matching variant (3-gang switch, FCU, cooker outlet, bell push)",
  "Circuit Protection": "no 40/50/63 A single-pole MCB in stock",
  "Distribution Boards": "TPN boards are only sold complete with breakers, so the price is not comparable",
  Lighting: "no matching wattage or body type",
  "Earthing & Bonding": "no earth rods, pits, bars, labels or compound",
  "Isolators & Control": "no 32/63 A DP or 4-pole isolators, no 25 A contactor",
  "Glands, Lugs & Terminations": "no brass SWA glands (only plastic PG glands); lugs start at 35 mmÃ‚Â²",
  "General Accessories": "no matching item",
};
for (const material of unmatched) {
  md.push(`| ${material.name.replace(/\|/g, "\\|")} | ${material.unit} | ${REASONS[material.category] ?? "no equivalent"} |`);
}

md.push(
  "",
  "---",
  "",
  `Prices were read once, on ${map.fetched}, and are the supplier's list prices before any promotion.`,
  "They can change without notice; re-run `node tools/apply-supplier-prices.mjs` to refresh.",
  "",
);
fs.writeFileSync(OUT_MD, md.join("\n"), "utf8");

console.log(`matched ${matches.length}/${materials.length} materials`);
console.log(`wrote ${path.relative(REPO, OUT_SQL)}`);
console.log(`wrote ${path.relative(REPO, OUT_MD)}`);
console.log("apply it with: node tools/apply-catalogue-prices.mjs");
