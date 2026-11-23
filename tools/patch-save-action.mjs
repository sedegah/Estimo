import fs from "node:fs";

const path = "components/quantities/quantity-view.tsx";
const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);

const start = lines.findIndex((line) => line.includes("Saved locally first"));
const end = lines.findIndex((line, index) => index > start && line.trim() === "};");
if (start < 0 || end < 0) throw new Error("save block not found");

const block = [
  "  /** One action: files the estimate under Saved projects and fills the basket. */",
  "  const saveEstimateNow = () => {",
  "    const counts = {",
  "      lights: result.totals.lighting_points,",
  "      sockets: result.totals.double_sockets,",
  "      switches: result.totals.switch_positions,",
  "      fans: result.totals.fan_points,",
  "      data: result.totals.data_points,",
  "      spaces: result.spaces.length,",
  "    };",
  "    const existing = listSavedEstimates().find(",
  "      (entry) => entry.quantities?.templateId === templateId && entry.quantities?.specLevel === specLevel,",
  "    );",
  "    const payload = {",
  "      name: `${templateName} estimate`,",
  '      kind: "quick" as const,',
  "      detail: `${templateName} · ${specLevel} · ${result.totals.floor_area_m2} m² · ${result.totals.total_final_circuits} circuits`,",
  "      totalGhs: total > 0 ? Math.round(total * 100) / 100 : null,",
  '      template: props.templateCode ?? "HOME-2B",',
  "      counts,",
  "      quality: specLevel,",
  "      items: lines.map((line) => ({",
  "        name: line.catalogueName,",
  "        quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),",
  "        unit: line.catalogueUnit,",
  "        priceGhs: line.unitPrice,",
  "      })),",
  "      quantities: {",
  "        templateId,",
  "        specLevel,",
  '        ruleSet: "ESTIMO-GH-QTY-v1.0",',
  "        spaces,",
  "        overrides,",
  "        specialLoads: loads,",
  "      },",
  "    };",
  "    const saved = existing ? updateSavedEstimate(existing.id, payload) : saveEstimate(payload);",
  "    if (!saved) return null;",
  "    if (props.signedIn) {",
  "      if (existing) void pushUpdate(saved);",
  "      else void pushCreate(saved);",
  "    }",
  "    return saved;",
  "  };",
];

const next = [...lines.slice(0, start), ...block, ...lines.slice(end + 1)];
fs.writeFileSync(path, next.join("\n"));
console.log("save action rewritten");
