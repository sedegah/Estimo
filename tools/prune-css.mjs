// One-off: strip CSS rules whose classes no longer appear anywhere in the app.
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
if (!root) throw new Error("usage: node prune-css.mjs <projectRoot>");

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) {
    if (["node_modules", ".next", ".git", "public"].includes(entry.name)) return [];
    return walk(full);
  }
  return /\.(tsx?|md)$/.test(entry.name) ? [full] : [];
});

const source = walk(root).map((file) => fs.readFileSync(file, "utf8")).join("\n");
const used = (name) => new RegExp(`[^a-zA-Z0-9_-]${name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}[^a-zA-Z0-9_-]`).test(source) || new RegExp(`"${name}"`).test(source);

const cssPath = path.join(root, "styles", "globals.css");
const css = fs.readFileSync(cssPath, "utf8");

// Split into top-level blocks, respecting @media nesting and comments.
const blocks = [];
let i = 0;
let buffer = "";
while (i < css.length) {
  const char = css[i];
  if (char === "/" && css[i + 1] === "*") {
    const end = css.indexOf("*/", i + 2);
    buffer += css.slice(i, end + 2);
    i = end + 2;
    continue;
  }
  if (char === "{") {
    // find matching close bracket
    let depth = 0;
    let j = i;
    for (; j < css.length; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") { depth--; if (depth === 0) break; }
    }
    const prelude = buffer.trim();
    const body = css.slice(i + 1, j);
    blocks.push({ prelude, body, raw: `${buffer}{${body}}` });
    buffer = "";
    i = j + 1;
    continue;
  }
  if (char === "}") { buffer += char; i++; continue; }
  buffer += char;
  i++;
}
if (buffer.trim()) blocks.push({ prelude: "", body: "", raw: buffer });

const classNames = (selector) => [...selector.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]);

function keepRule(prelude) {
  if (prelude.startsWith("@keyframes") || prelude.startsWith("@font-face")) return true;
  if (prelude.startsWith("@media")) return null; // handled by caller
  const names = classNames(prelude);
  if (!names.length) return true;               // element/attribute selectors stay
  return names.some(used);                       // keep if any class is still used
}

const kept = [];
let removedRules = 0;

for (const block of blocks) {
  if (block.prelude.startsWith("@media")) {
    // split nested rules inside the media block
    const inner = [];
    let k = 0;
    let prelude = "";
    while (k < block.body.length) {
      const char = block.body[k];
      if (char === "{") {
        let depth = 0;
        let j = k;
        for (; j < block.body.length; j++) {
          if (block.body[j] === "{") depth++;
          else if (block.body[j] === "}") { depth--; if (depth === 0) break; }
        }
        const body = block.body.slice(k + 1, j);
        const selector = prelude.trim();
        if (keepRule(selector)) inner.push(`${selector}{${body}}`);
        else removedRules++;
        prelude = "";
        k = j + 1;
        continue;
      }
      prelude += char;
      k++;
    }
    if (inner.length) kept.push(`${block.prelude}{${inner.join("")}}`);
    continue;
  }
  if (keepRule(block.prelude)) kept.push(block.raw);
  else removedRules++;
}

const out = kept.join("\n");
fs.writeFileSync(cssPath, out + "\n", "utf8");
console.log(`kept ${kept.length} blocks, removed ${removedRules} rules, ${css.length} -> ${out.length} bytes`);
