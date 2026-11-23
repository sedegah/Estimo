import fs from "node:fs";

const pagePath = "app/(app)/projects/[id]/page.tsx";
let page = fs.readFileSync(pagePath, "utf8");

// the heading already names the building, so the meta line carries the rest
page = page.replace(
  '{takeOff.spaces.length} space{takeOff.spaces.length === 1 ? "" : "s"} · {project.detail}',
  '{takeOff.spaces.length} space{takeOff.spaces.length === 1 ? "" : "s"} · {project.detail.split(" · ").slice(1).join(" · ")}',
);

// acronyms stay capitalised in the special-load list
page = page.replace(
  '<td>{key.replace(/_/g, " ").replace(/^\\w/, (letter: string) => letter.toUpperCase())}</td>',
  '<td>{loadName(key)}</td>',
);

const helper = [
  "/** Readable special-load names, acronyms included. */",
  "const LOAD_NAMES: Record<string, string> = {",
  '  refrigerator: "Refrigerator",',
  '  freezer: "Freezer",',
  '  microwave: "Microwave",',
  '  electric_cooker: "Electric cooker",',
  '  dishwasher: "Dishwasher",',
  '  washing_machine: "Washing machine",',
  '  extractor: "Extractor",',
  '  water_heater: "Water heater",',
  '  air_conditioner: "Air conditioner",',
  '  water_pump: "Water pump",',
  '  gate_motor: "Gate motor",',
  '  ev_charger: "EV charger",',
  '  workshop_machine: "Workshop machine",',
  '  refrigeration_equipment: "Refrigeration equipment",',
  "};",
  "",
  "const loadName = (key: string) =>",
  '  LOAD_NAMES[key] ?? key.replace(/_/g, " ").replace(/^\\w/, (letter) => letter.toUpperCase());',
  "",
].join("\n");

const marker = "const itemQuantity =";
const at = page.indexOf(marker);
if (at < 0) throw new Error("helper anchor missing");
if (!page.includes("const loadName")) {
  page = page.slice(0, at) + helper + page.slice(at);
}

fs.writeFileSync(pagePath, page);
console.log("saved take-off: meta line trimmed and load names fixed");
