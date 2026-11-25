import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/kimat/Desktop/estimo-v12/estimo_qty_engine_handoff";
const data = path.join(root, "data");

const read = (name) => JSON.parse(fs.readFileSync(path.join(data, name), "utf8"));

for (const file of ["special_loads.json", "assemblies.json", "db_location_rules.json", "db_type_rules.json", "multi_db_rules.json", "template_db_locations.json", "template_space_routes.json"]) {
  const rows = read(file);
  console.log(`\n== ${file} (${rows.length})`);
  console.log(JSON.stringify(rows.slice(0, 4), null, 1));
}

console.log("\n== assembly_items sample");
console.log(JSON.stringify(read("assembly_items.json").slice(0, 8), null, 1));

const expected = JSON.parse(fs.readFileSync(path.join(root, "tests", "expected_template_outputs_standard.json"), "utf8"));
console.log(`\n== expected outputs (${expected.length}) keys:`);
console.log(Object.keys(expected[0]).join(", "));
console.log(JSON.stringify(expected[0], null, 1));
