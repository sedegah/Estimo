/**
 * Copies the quantity engine and its rule data into the admin console.
 *
 * The console is a separate Next app, so it carries its own copy; this script keeps
 * both in step after a rule change in lib/data/quantity-engine.
 *
 *   node tools/sync-quantity-engine.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "lib", "quantity-engine");
const sourceData = path.join(root, "lib", "data", "quantity-engine");
const target = path.join(root, "admin", "lib", "quantity-engine");
const targetData = path.join(root, "admin", "lib", "data", "quantity-engine");

const FILES = ["types.ts", "engine.ts", "catalogue.ts", "index.ts"];
const DATA = [
  "global_parameters.json",
  "room_rules.json",
  "circuit_rules.json",
  "structure_templates.json",
  "template_spaces.json",
  "assemblies.json",
  "assembly_items.json",
  "special_loads.json",
];

fs.mkdirSync(target, { recursive: true });
fs.mkdirSync(targetData, { recursive: true });

for (const file of FILES) {
  let text = fs.readFileSync(path.join(source, file), "utf8");
  // the console resolves @/ to admin/, so the data path stays the same shape
  text = text.replaceAll('from "@/lib/data/quantity-engine/', 'from "@/lib/data/quantity-engine/');
  text = text.replace(
    "// Public API of the ESTIMO quantity engine.",
    "// Public API of the ESTIMO quantity engine.\n// Synced from the website by tools/sync-quantity-engine.mjs — edit it there.",
  );
  fs.writeFileSync(path.join(target, file), text, "utf8");
}

for (const file of DATA) {
  fs.copyFileSync(path.join(sourceData, file), path.join(targetData, file));
}

console.log(`quantity engine synced to ${path.relative(root, target)} (${FILES.length} files, ${DATA.length} rule files)`);
