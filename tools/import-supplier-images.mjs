#!/usr/bin/env node
/**
 * Copies the supplier's product photos for every material we match, into R2.
 *
 *   node tools/import-supplier-images.mjs [--feed raw.json] [--upload]
 *
 * - resolves the curated match map to each supplier product's first photo
 * - downloads the photos into .cache/supplier-images (re-run safe)
 * - uploads them to the R2 bucket as materials/<material-id>.<ext>
 * - writes lib/db/seed-catalogue-images.sql (catalogue_items.image_key)
 * - writes docs/IMAGE-SOURCES-ELECTRICAL-SUPPLIES.md for attribution
 *
 * Pass --upload to actually push to R2; without it only the downloads and the
 * seed file are produced. Upload uses the local `wrangler login`.
 */
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";

const REPO = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};
const upload = args.includes("--upload");

const BUCKET = "estimo-materials";
const CACHE = path.join(REPO, ".cache", "supplier-images");
const OUT_SQL = path.join(REPO, "lib", "db", "seed-catalogue-images.sql");
const OUT_MD = path.join(REPO, "docs", "IMAGE-SOURCES-ELECTRICAL-SUPPLIES.md");

const FEED_URL = "https://www.electricalsuppliesgh.com/products.json?limit=250&page=";

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
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return products;
}

const products = await loadFeed();
const map = JSON.parse(fs.readFileSync(path.join(REPO, "lib", "data", "supplier-price-map.json"), "utf8"));
const additions = JSON.parse(fs.readFileSync(path.join(REPO, "lib", "data", "supplier-new-materials.json"), "utf8"));
const entries = [
  ...map.entries,
  ...additions.map(({ id, ...rest }) => ({ ...rest, material: id, added: true })),
];

fs.mkdirSync(CACHE, { recursive: true });

const rows = [];
const skipped = [];
for (const entry of entries) {
  const needle = entry.match.toLowerCase().replace(/[‑–—]/g, "-");
  const hits = products.filter((product) => product.title.toLowerCase().replace(/[‑–—]/g, "-").includes(needle));
  if (hits.length !== 1) { skipped.push({ material: entry.material, why: `${hits.length} product matches` }); continue; }

  const product = hits[0];
  const image = (product.images ?? [])[0];
  if (!image?.src) { skipped.push({ material: entry.material, why: "no photo on the listing" }); continue; }

  const url = new URL(image.src.split("?")[0]);
  const ext = (path.extname(url.pathname) || ".jpg").toLowerCase().replace(".jpeg", ".jpg");
  const file = path.join(CACHE, `${entry.material}${ext}`);

  if (!fs.existsSync(file)) {
    const response = await fetch(image.src);
    if (!response.ok) { skipped.push({ material: entry.material, why: `photo answered ${response.status}` }); continue; }
    fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  rows.push({
    material: entry.material,
    key: `materials/${entry.material}${ext}`,
    file,
    source: image.src,
    product: product.title,
    handle: product.handle,
    bytes: fs.statSync(file).size,
  });
}

console.log(`photos: ${rows.length} | skipped: ${skipped.length} | ${(rows.reduce((n, r) => n + r.bytes, 0) / 1024 / 1024).toFixed(1)} MB`);

const MEDIA_TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", gif: "image/gif" };
const contentTypeOf = (file) => MEDIA_TYPES[path.extname(file).slice(1).toLowerCase()] ?? "image/jpeg";

if (upload) {
  // resolve wrangler once instead of paying npx startup per object
  let wranglerBin = null;
  try {
    const cache = path.join(process.env.LOCALAPPDATA ?? "", "npm-cache", "_npx");
    for (const entry of fs.readdirSync(cache)) {
      const candidate = path.join(cache, entry, "node_modules", "wrangler", "bin", "wrangler.js");
      if (fs.existsSync(candidate)) { wranglerBin = candidate; break; }
    }
  } catch { /* fall back to npx below */ }
  const wranglerCommand = wranglerBin ? `"${process.execPath}" "${wranglerBin}"` : "npx -y wrangler@latest";

  const run = (command) => new Promise((resolve) => {
    const child = exec(command, { cwd: REPO });
    let detail = "";
    child.stderr?.on("data", (chunk) => { detail += chunk.toString(); });
    child.on("close", (code) => resolve({ ok: code === 0, detail }));
  });

  const queue = [...rows];
  const failed = [];
  let done = 0;
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const row = queue.shift();
      const contentType = contentTypeOf(row.file);
      const command = `${wranglerCommand} r2 object put "${BUCKET}/${row.key}" --file="${row.file}" --content-type=${contentType} --remote`;
      let ok = false;
      for (let attempt = 1; attempt <= 3 && !ok; attempt += 1) {
        const result = await run(command);
        ok = result.ok;
        if (!ok && attempt === 3) {
          failed.push({ key: row.key, detail: result.detail.replace(/\x1b\[[0-9;]*m/g, "").trim().slice(-160) });
        }
      }
      if (ok) done += 1;
      if ((done + failed.length) % 10 === 0) console.log(`  ${done + failed.length}/${rows.length} processed (${failed.length} failed)`);
    }
  });
  await Promise.all(workers);

  console.log(`uploaded ${done}/${rows.length} objects to ${BUCKET}`);
  if (failed.length) {
    console.log("failed objects:");
    for (const entry of failed) console.log(`  - ${entry.key}: ${entry.detail}`);
  }
}

const sql = [
  "-- Generated by tools/import-supplier-images.mjs — photos for matched materials.",
  "-- Requires migration 0007 (catalogue_items.image_key).",
  ...rows.map((row) =>
    `UPDATE catalogue_items SET image_key = '${row.key}' WHERE id = '${row.material}';`,
  ),
  "",
];
fs.writeFileSync(OUT_SQL, sql.join("\n"), "utf8");

const md = [
  "# Image sources — Electrical Supplies Ghana",
  "",
  `Photos copied from the supplier's product listings on ${new Date().toISOString().slice(0, 10)} and stored in the`,
  `\`${BUCKET}\` R2 bucket, one object per catalogue material.`,
  "",
  "| Catalogue material | Supplier product | Photo |",
  "| --- | --- | --- |",
  ...rows.map((row) =>
    `| ${row.material} | [${row.product.replace(/\|/g, "\\|")}](https://www.electricalsuppliesgh.com/products/${row.handle}) | \`${row.key}\` |`,
  ),
  "",
  "Material without a photo: " + (skipped.map((row) => row.material).join(", ") || "none"),
  "",
];
fs.writeFileSync(OUT_MD, md.join("\n"), "utf8");

console.log(`wrote ${path.relative(REPO, OUT_SQL)}`);
console.log(`wrote ${path.relative(REPO, OUT_MD)}`);
