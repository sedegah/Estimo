// Build a seed SQL file for the D1 catalogue from lib/data/catalogue.ts.
// Usage: node tools/seed-catalogue.mjs
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "lib", "data", "catalogue.ts"), "utf8");
const start = source.indexOf("CATALOGUE_MATERIALS");
const arrayStart = source.indexOf("= [", start) + 2;
const arrayEnd = source.lastIndexOf("];");
const materials = JSON.parse(source.slice(arrayStart, arrayEnd + 1));

const esc = (value) => String(value ?? "").replace(/'/g, "''");

const lines = ["-- Generated seed: catalogue items from the bundled material library."];
for (const item of materials) {
  lines.push(
    `INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)\n` +
      `VALUES ('${esc(item.id)}', '${esc(item.code)}', '${esc(item.name)}', '${esc(item.category)}', '${esc(item.unit)}', ` +
      `'${esc(item.spec)}', '${esc(item.tier)}', '${esc(item.relevance)}', '${esc(JSON.stringify(item.keywords ?? []))}', 1)\n` +
      `ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, ` +
      `spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;`,
  );
}

const out = path.join(root, "lib", "db", "seed-catalogue.sql");
fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`items: ${materials.length} -> ${out}`);
