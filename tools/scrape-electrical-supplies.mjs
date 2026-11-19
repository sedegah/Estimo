#!/usr/bin/env node
/**
 * Builds a full price list for Electrical Supplies Ghana (a Shopify storefront).
 *
 *   node tools/scrape-electrical-supplies.mjs                  # fetch live, write docs/
 *   node tools/scrape-electrical-supplies.mjs --input raw.json # rebuild from a saved copy
 *   node tools/scrape-electrical-supplies.mjs --out other.md
 *
 * Prices come from the storefront's public product feed. Where an item is on
 * promotion the feed carries a "compare at" price; this list always uses the
 * full (compare-at) price, never the promotional one.
 */
import fs from "node:fs";
import path from "node:path";

const STORE = "https://www.electricalsuppliesgh.com";
const FEED = `${STORE}/products.json?limit=250&page=`;
const REPO = path.resolve(import.meta.dirname, "..");
const DEFAULT_OUT = path.join(REPO, "docs", "ELECTRICAL-SUPPLIES-GH-PRICES.md");

const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};

const OUT = flag("out") ?? DEFAULT_OUT;
const INPUT = flag("input");

const normalizeSpace = (value) => (value ?? "").replace(/\s+/g, " ").trim();
const number = (value) => (value == null || value === "" ? null : Number(value));

/** Escapes the characters that break a markdown table cell. */
const cell = (value) => normalizeSpace(String(value ?? "")).replace(/\|/g, "\\|");

/** GitHub-style heading anchor. */
const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");

const money = (value) =>
  value == null ? "—" : value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function fetchAll() {
  const products = [];
  for (let page = 1; page <= 60; page++) {
    const response = await fetch(`${FEED}${page}`, { headers: { "User-Agent": "ESTIMO-catalogue-import/1.0" } });
    if (!response.ok) throw new Error(`page ${page} answered ${response.status}`);
    const { products: batch = [] } = await response.json();
    console.log(`page ${page}: ${batch.length} products`);
    if (!batch.length) break;
    products.push(...batch);
    if (batch.length < 250) break;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return products;
}

function brandsOf(products) {
  const groups = new Map();
  for (const product of products) {
    const label = normalizeSpace(product.vendor);
    if (!label) continue;
    const key = label.toLowerCase();
    const entry = groups.get(key) ?? { counts: new Map(), total: 0 };
    entry.counts.set(label, (entry.counts.get(label) ?? 0) + 1);
    entry.total += 1;
    groups.set(key, entry);
  }
  const display = new Map();
  for (const [key, entry] of groups) {
    const best = [...entry.counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
    display.set(key, { label: best, total: entry.total });
  }
  return display;
}

function build(products) {
  const brandMap = brandsOf(products);

  const rows = products.map((product) => {
    const variant = product.variants?.[0] ?? {};
    const promo = number(variant.price);
    const compare = number(variant.compare_at_price);
    const full = compare != null && promo != null && compare > promo ? compare : promo;
    const brand = brandMap.get(normalizeSpace(product.vendor).toLowerCase());

    return {
      title: normalizeSpace(product.title),
      url: `${STORE}/products/${product.handle}`,
      sku: normalizeSpace(variant.sku) || "—",
      brand: brand?.label ?? "—",
      price: full != null && full > 0 ? full : null,
      promoPrice: promo != null && compare != null && compare > promo ? promo : null,
      available: variant.available !== false,
      category: normalizeSpace(product.product_type) || "Uncategorised",
      tags: (product.tags ?? []).map(normalizeSpace).filter(Boolean),
    };
  });

  rows.sort((a, b) => a.category.localeCompare(b.category, "en") || a.title.localeCompare(b.title, "en"));

  const categories = new Map();
  for (const row of rows) {
    const bucket = categories.get(row.category) ?? [];
    bucket.push(row);
    categories.set(row.category, bucket);
  }
  const categoryOrder = [...categories.keys()].sort((a, b) => a.localeCompare(b, "en"));

  const priced = rows.map((r) => r.price).filter((value) => value != null);
  const inStock = rows.filter((r) => r.available).length;
  const promotions = rows.filter((r) => r.promoPrice != null).length;
  const unpriced = rows.filter((r) => r.price == null).length;
  const brandTotals = [...brandMap.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "en"));
  const placeholderBrand = brandTotals.find((brand) => brand.label.toLowerCase() === "my store");
  const pulled = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

  const lines = [];
  const push = (...next) => lines.push(...next);

  push(
    "# Electrical Supplies Ghana — full price list",
    "",
    `> Source: [${STORE.replace("https://", "")}](${STORE}/) · pulled ${pulled}`,
    `> ${rows.length.toLocaleString("en-GB")} products · ${categoryOrder.length} categories · ${brandTotals.length} brands · prices in GHS`,
    ">",
    "> **Price basis:** the **full (pre-promotion) price**. Where the storefront is running a",
    "> promotion, this list uses the “compare at” price rather than the promotional price, as",
    "> requested. Promotional prices are deliberately left out.",
    "",
    "## At a glance",
    "",
    "| Metric | Value |",
    "| --- | --- |",
    `| Products | ${rows.length.toLocaleString("en-GB")} |`,
    `| Categories | ${categoryOrder.length} |`,
    `| Brands | ${brandTotals.length} |`,
    `| In stock | ${inStock.toLocaleString("en-GB")} |`,
    `| Out of stock | ${(rows.length - inStock).toLocaleString("en-GB")} |`,
    `| Products currently on promotion | ${promotions.toLocaleString("en-GB")} (full price shown) |`,
    `| Price not listed | ${unpriced.toLocaleString("en-GB")} |`,
    `| Full price range | GHS ${money(Math.min(...priced))} – ${money(Math.max(...priced))} |`,
    "",
    "## Brands",
    "",
    "| Brand | Products |",
    "| --- | ---: |",
  );
  for (const brand of brandTotals) push(`| ${cell(brand.label)} | ${brand.total} |`);
  if (placeholderBrand) {
    push(
      "",
      `“${placeholderBrand.label}” is the storefront's placeholder vendor name — those ${placeholderBrand.total} items are listed without a real brand.`,
    );
  }

  push("", "## Category index", "", "| Category | Products | Category | Products |", "| --- | ---: | --- | ---: |");
  const half = Math.ceil(categoryOrder.length / 2);
  const left = categoryOrder.slice(0, half);
  const right = categoryOrder.slice(half);
  for (let i = 0; i < half; i++) {
    const one = left[i];
    const two = right[i];
    const oneCell = `[${cell(one)}](#${slug(one)})`;
    const twoCell = two ? `[${cell(two)}](#${slug(two)})` : "";
    push(`| ${oneCell} | ${categories.get(one).length} | ${twoCell} | ${two ? categories.get(two).length : ""} |`);
  }

  push("", "## Products by category", "");

  for (const category of categoryOrder) {
    const bucket = categories.get(category);
    push(
      `### ${category}`,
      "",
      `${bucket.length} product${bucket.length === 1 ? "" : "s"}.`,
      "",
      "| Product | SKU | Brand | Full price (GHS) | Stock |",
      "| --- | --- | --- | ---: | --- |",
    );
    for (const row of bucket) {
      const stock = row.available ? "In stock" : "Out of stock";
      push(`| [${cell(row.title)}](${row.url}) | ${cell(row.sku)} | ${cell(row.brand)} | ${money(row.price)} | ${stock} |`);
    }
    push("");
  }

  push(
    "## Notes on this data",
    "",
    "- Prices are the storefront's own list prices, in Ghana cedis, as published in its product feed.",
    "- Where a promotion is running, the price shown is the full “compare at” price, not the promotional price.",
    unpriced
      ? `- ${unpriced} item${unpriced === 1 ? "" : "s"} carry no price in the feed and are marked “—”.`
      : "- Every item carries a price in the feed.",
    "- Categories are the storefront's own product types and are reproduced unchanged, so near-duplicates",
    "  (for example “Air Circuit Breaker” and “Air Circuit Breakers”) appear as separate groups.",
    "- Products with several options are listed once, at their first variant's price.",
    "",
    "---",
    "",
    `Pulled from the public product feed at \`${STORE}/products.json\` on ${pulled}.`,
    "Prices can change without notice; this file is a reference, not a quotation.",
    "",
  );

  return lines.join("\n");
}

const products = INPUT ? JSON.parse(fs.readFileSync(INPUT, "utf8")) : await fetchAll();
const markdown = build(products);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, markdown);
process.stdout.write(`wrote ${OUT} (${(markdown.length / 1024).toFixed(0)} KB, ${products.length} products)\n`);
