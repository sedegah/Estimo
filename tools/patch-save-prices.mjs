import fs from "node:fs";

const path = "components/quantities/quantity-view.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

// 1) one price loader that can be awaited before saving
const oldEffect = text.match(/  \/\/ Prices arrive after the page[\s\S]*?\n  \}, \[livePrices, props\.catalogue\]\);\n/);
if (!oldEffect) throw new Error("price effect not found");

const newEffect = `  const pricesFetched = useRef(false);

  /** Catalogue prices, fetched once, so a save always records real amounts. */
  const loadPrices = useCallback(async (): Promise<Record<string, PriceEntry>> => {
    if (Object.keys(livePrices).length) return livePrices;
    const base = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? "https://estimo-api.sedegahkimathi.workers.dev";
    const ids = new Set(Object.keys(props.catalogue));
    if (!ids.size) return {};
    try {
      const response = await fetch(\`\${base}/catalogue\`);
      if (!response.ok) return {};
      const body = (await response.json()) as {
        items?: { id: string; price_ghs: number | null; price_brand?: string | null; price_source?: string | null; price_updated_at?: string | null }[];
      };
      const next: Record<string, PriceEntry> = {};
      for (const item of body.items ?? []) {
        if (!ids.has(item.id) || typeof item.price_ghs !== "number") continue;
        next[item.id] = {
          price: item.price_ghs,
          brand: item.price_brand ?? null,
          source: item.price_source ?? null,
          updatedAt: item.price_updated_at ?? null,
        };
      }
      setLivePrices(next);
      pricesFetched.current = true;
      return next;
    } catch {
      return {};
    }
  }, [livePrices, props.catalogue]);

  useEffect(() => {
    if (Object.keys(props.prices).length) {
      setLivePrices(props.prices);
      return;
    }
    if (Object.keys(livePrices).length || pricesFetched.current) return;
    void loadPrices();
  }, [livePrices, props.prices, loadPrices]);
`;
text = text.replace(oldEffect[0], newEffect);

text = text.replace(
  'import { useEffect, useMemo, useState } from "react";',
  'import { useCallback, useEffect, useMemo, useRef, useState } from "react";',
);

// 2) save is async and prices the lines it records
text = text.replace(
  "  const saveEstimateNow = () => {",
  "  const saveEstimateNow = async () => {\n    const pricesNow = await loadPrices();\n    const saveLines = priceQuantities(result.materialQuantities, pricesNow, catalogueMap);\n    const saveTotal = pricedTotal(saveLines);",
);
text = text.replace(
  `      totalGhs: total > 0 ? Math.round(total * 100) / 100 : null,`,
  `      totalGhs: saveTotal > 0 ? saveTotal : null,`,
);
text = text.replace(
  `      items: lines.map((line) => ({`,
  `      items: saveLines.map((line) => ({`,
);

// 3) the action awaits the save
text = text.replace(
  "  const addToEstimate = () => {",
  "  const addToEstimate = async () => {",
);
text = text.replace(
  "    const saved = saveEstimateNow();",
  "    const saved = await saveEstimateNow();",
);

fs.writeFileSync(path, text);
console.log("save awaits prices and records priced lines");
