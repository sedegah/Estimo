import fs from "node:fs";

// TV, data and fan points are counted by the rule set but have no assembly in the
// handoff. They are still electrical points, so they carry the same kind of materials:
// a TV point is an outlet, a data point is an outlet plus its cable, a fan point is a
// control point. These mappings are ESTIMO decisions, recorded here in one place.
const catPath = "lib/quantity-engine/catalogue.ts";
let cat = fs.readFileSync(catPath, "utf8").replace(/\r\n/g, "\n");
if (!cat.includes('"data_cable"')) {
  cat = cat.replace(
    'const MATERIAL_CATALOGUE: Record<string, CatalogueLink> = {',
    'const MATERIAL_CATALOGUE: Record<string, CatalogueLink> = {\n  "data_cable": { id: "mat-cab-data-cat6" },',
  );
}
fs.writeFileSync(catPath, cat);

const enginePath = "lib/quantity-engine/engine.ts";
let engine = fs.readFileSync(enginePath, "utf8").replace(/\r\n/g, "\n");

const anchor = "  // accessory allowances and pack rounding";
if (!engine.includes(anchor)) throw new Error("rounding anchor missing");

const block = `  // TV, data and fan points: no assembly in the handoff, so they are costed here from
  // the same material family as the point they belong to.
  const extraPoints: { key: string; count: number; fixed: string[]; route: string[] }[] = [
    { key: "tv_point", count: totals.tv_points, fixed: ["double_13a_socket", "socket_mounting_box"], route: ["2.5mm2_phase_conductor", "2.5mm2_neutral_conductor", "cpc_conductor", "20mm_conduit"] },
    { key: "data_point", count: totals.data_points, fixed: ["socket_mounting_box"], route: ["data_cable"] },
    { key: "fan_point", count: totals.fan_points, fixed: ["switch_mechanism", "switch_mounting_box"], route: ["lighting_conductors", "20mm_conduit"] },
  ];
  const pointRouteM = args.loadRouteM ?? 8;
  for (const group of extraPoints) {
    if (!group.count) continue;
    for (const key of group.fixed) {
      const existing = rows.get(key);
      if (existing) existing.engineering_quantity = round1(existing.engineering_quantity + group.count);
      else
        rows.set(key, {
          material_key: key,
          name: MATERIAL_LABELS[key] ?? key,
          unit: "each",
          engineering_quantity: group.count,
          purchase_quantity: 0,
          pack_size: null,
          trace: [\`\${group.count} \${group.key.replace("_", " ")} point\${group.count === 1 ? "" : "s"}\`],
          confidence: "medium",
        });
    }
    for (const key of group.route) {
      const amount = round1(pointRouteM * group.count);
      const existing = rows.get(key);
      if (existing) existing.engineering_quantity = round1(existing.engineering_quantity + amount);
      else
        rows.set(key, {
          material_key: key,
          name: MATERIAL_LABELS[key] ?? key,
          unit: key === "20mm_conduit" ? "m" : "m",
          engineering_quantity: amount,
          purchase_quantity: 0,
          pack_size: null,
          trace: [\`\${pointRouteM} m route per \${group.key.replace("_", " ")}\`],
          confidence: "estimated",
        });
    }
  }

`;

engine = engine.replace(anchor, block + anchor);
fs.writeFileSync(enginePath, engine);
console.log("tv/data/fan points now carry materials");
