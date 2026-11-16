// One-off generator: parses the ESTIMO SQL seed into a local TS dataset.
// Run: node tools/build-catalogue-data.mjs <projectDir>
import fs from "node:fs";
import path from "node:path";

const seedDir = process.argv[2];
const outDir = process.argv[3] ?? seedDir;
if (!seedDir) throw new Error("usage: node build-catalogue-data.mjs <seedProjectDir> [outProjectDir]");
const mig = path.join(seedDir, "supabase", "migrations");
const read = (f) => fs.readFileSync(path.join(mig, f), "utf8");

// The bundled SQL is double-encoded (UTF-8 bytes read as latin1); repair it.
const fix = (s) => (typeof s === "string" && /[\u00C2\u00C3\u00E2]/.test(s)
  ? Buffer.from(s, "latin1").toString("utf8")
  : s);

function readString(s, i) {
  let out = "";
  i++;
  while (i < s.length) {
    if (s[i] === "'") {
      if (s[i + 1] === "'") { out += "'"; i += 2; continue; }
      return [out, i + 1];
    }
    out += s[i++];
  }
  throw new Error("unterminated string");
}

function readParen(s, i) {
  let depth = 0;
  const start = i;
  for (; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") { depth--; if (depth === 0) return [s.slice(start + 1, i), i + 1]; }
    else if (s[i] === "'") { const [, n] = readString(s, i); i = n - 1; }
  }
  throw new Error("unbalanced paren");
}

function readArray(s, i) {
  const start = s.indexOf("[", i);
  let depth = 0;
  for (let j = start; j < s.length; j++) {
    if (s[j] === "[") depth++;
    else if (s[j] === "]") {
      depth--;
      if (depth === 0) {
        const inner = s.slice(start + 1, j);
        const items = [];
        let k = 0;
        while (k < inner.length) {
          if (inner[k] === "'") { const [v, n] = readString(inner, k); items.push(v); k = n; }
          else k++;
        }
        return [items, j + 1];
      }
    } else if (s[j] === "'") { const [, n] = readString(s, j); j = n - 1; }
  }
  throw new Error("unbalanced array");
}

function splitRow(line) {
  const s = line.trim().replace(/,\s*$/, "");
  if (!s.startsWith("(")) return null;
  const [inner] = readParen(s, 0);
  const fields = [];
  let i = 0;
  while (i < inner.length) {
    const c = inner[i];
    if (c === "," || /\s/.test(c)) { i++; continue; }
    if (c === "'") { const [v, n] = readString(inner, i); fields.push(v); i = n; continue; }
    if (inner.startsWith("ARRAY", i)) {
      const [v, n] = readArray(inner, i);
      let j = n;
      if (inner.startsWith("::", j)) { j += 2; while (j < inner.length && /[A-Za-z0-9_[\]]/.test(inner[j])) j++; }
      fields.push(v);
      i = j;
      continue;
    }
    if (inner.startsWith("(select", i)) {
      const [sub, n] = readParen(inner, i);
      const m = /code='([^']*)'/.exec(sub);
      fields.push({ ref: m ? m[1] : null });
      i = n;
      continue;
    }
    let j = i;
    while (j < inner.length && inner[j] !== "," && inner[j] !== ")") j++;
    fields.push(inner.slice(i, j).trim());
    i = j;
  }
  return fields;
}

// ---------- reference data ----------
const ref = read("2026090710_seed_reference_data.sql");
const units = [];
const categories = [];
for (const raw of ref.split("\n")) {
  const t = raw.trimStart();
  if (!t.startsWith("('")) continue;
  const f = splitRow(t);
  if (!f) continue;
  if (f.length === 6 && /^U-/.test(f[0])) units.push({ code: f[0], name: fix(f[1]), symbol: fix(f[2]) });
  if (f.length === 5 && /^CAT-/.test(f[0])) categories.push({ code: f[0], name: fix(f[1]) });
}
const unitByCode = new Map(units.map((u) => [u.code, u]));
const catByCode = new Map(categories.map((c) => [c.code, c]));

// ---------- materials ----------
const matSql = read("2026090711_seed_122_core_materials.sql");
const materials = [];
const problems = [];
let seenRows = 0;
for (const raw of matSql.split("\n")) {
  const t = raw.trimStart();
  if (!/^\('[A-Z]{2,5}-/.test(t)) continue;
  seenRows++;
  let f;
  try { f = splitRow(t); } catch (e) { problems.push({ line: t.slice(0, 70), err: String(e) }); continue; }
  if (!f || f.length < 13) { problems.push({ line: t.slice(0, 70), err: `fields=${f && f.length}` }); continue; }
  const [code, , category, name, purpose, unit, spec, tier, relevance, , keywords, active] = f;
  if (String(active).toUpperCase() !== "TRUE") { problems.push({ code, err: `inactive=${active}` }); continue; }
  const catCode = category && category.ref;
  const unitCode = unit && unit.ref;
  const cat = catByCode.get(catCode);
  const un = unitByCode.get(unitCode);
  if (!cat) problems.push({ code, err: `unknown category ${catCode}` });
  if (!un) problems.push({ code, err: `unknown unit ${unitCode}` });
  materials.push({
    id: `mat-${String(code).toLowerCase()}`,
    code: String(code),
    name: fix(name),
    purpose: fix(purpose) || "",
    spec: fix(spec) || "",
    tier: fix(tier) || "",
    relevance: fix(relevance) || "",
    keywords: Array.isArray(keywords) ? keywords.map(fix) : [],
    categoryCode: catCode || "",
    category: cat ? cat.name : (catCode || "Uncategorised"),
    unitCode: unitCode || "",
    unit: un ? un.symbol : "\u2014",
  });
}

if (problems.length) console.error(`PROBLEMS (${problems.length}):`, JSON.stringify(problems.slice(0, 12), null, 2));

const header = `// ESTIMO local material library: 122 core electrical materials bundled with the app (no database).
import type { CatalogueMaterial } from "@/lib/types";

export const CATALOGUE_CATEGORIES: { code: string; name: string }[] = ${JSON.stringify(categories, null, 2)};

export const CATALOGUE_UNITS: { code: string; name: string; symbol: string }[] = ${JSON.stringify(units, null, 2)};

export const CATALOGUE_MATERIALS: CatalogueMaterial[] = ${JSON.stringify(materials, null, 2)};

export const materialById = (id: string) => CATALOGUE_MATERIALS.find((m) => m.id === id);
`;

const out = path.join(outDir, "lib", "data", "catalogue.ts");
fs.writeFileSync(out, header, "utf8");
console.log(`rows=${seenRows} units=${units.length} categories=${categories.length} materials=${materials.length} -> ${out}`);
