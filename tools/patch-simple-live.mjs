import fs from "node:fs";

const path = "app/quick-estimate/page.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

// 1) imports: the live engine becomes the pricing source for the summary
text = text.replace(
  `import { saveEstimate } from "@/lib/storage/saved-estimates";`,
  `import {
  fetchLivePrices,
  liveEstimate,
  spacesFromCounts,
  specLevelForQuality,
  TEMPLATE_FOR_CODE,
  templateForCode,
} from "@/lib/estimate-live";
import { saveEstimate } from "@/lib/storage/saved-estimates";`,
);

// 2) state: live total from the same engine the itemized page uses
text = text.replace(
  `  const total = computeEstimate(type.code, counts, quality);
  const fittingsLabel = FITTINGS.find((entry) => entry.value === quality)?.label ?? "Standard";
  const spaces = totalSpaces(counts);

  const itemizedHref = () => {
    const params = new URLSearchParams({ template: type.code, quality });
    return \`/itemized?\${params.toString()}\`;
  };
`,
  `  const templateId = TEMPLATE_FOR_CODE[type.code] ?? "T011";
  const specLevel = specLevelForQuality(quality);
  const planSpaces = useMemo(
    () => spacesFromCounts(templateId, counts),
    [templateId, counts],
  );

  // prices come from the same catalogue call the itemized screen makes
  const [prices, setPrices] = useState<Record<string, never> | null>(null);
  useEffect(() => {
    let cancelled = false;
    void fetchLivePrices().then((live) => {
      if (!cancelled) setPrices(live as Record<string, never>);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const live = useMemo(
    () =>
      liveEstimate({
        templateId,
        specLevel,
        spaces: planSpaces,
        prices: (prices ?? {}) as Parameters<typeof liveEstimate>[0]["prices"],
      }),
    [templateId, specLevel, planSpaces, prices],
  );

  const total = live.total;
  const fittingsLabel = FITTINGS.find((entry) => entry.value === quality)?.label ?? "Standard";
  const spaces = planSpaces.length;

  /** The itemized screen opens with exactly this plan, so the totals match. */
  const openItemized = () => {
    try {
      localStorage.setItem(
        "estimo_estimate_draft_v1",
        JSON.stringify({
          templateId,
          specLevel,
          spaces: planSpaces,
          overrides: [],
          loads: [],
        }),
      );
    } catch {}
    router.push(\`/itemized?template=\${encodeURIComponent(type.code)}&quality=\${quality}\`);
  };
`,
);

// 3) the totals shown in the side card come from the live estimate
text = text.replace(
  `      totalGhs: total,
      template: type.code,`,
  `      totalGhs: total > 0 ? total : null,
      template: type.code,`,
);

// 4) one primary action: open the itemized estimate with this plan
text = text.replace(
  `          <button className="btn-amber side-cta" type="button" onClick={() => router.push(estimateQuery())}>
            See estimate
          </button>
          <Link className="btn-outline side-secondary" href={itemizedHref()}>Itemized estimate</Link>`,
  `          <button className="btn-amber side-cta" type="button" onClick={openItemized}>
            Itemized estimate
          </button>`,
);

// 5) useMemo import
text = text.replace(
  'import { Suspense, useEffect, useRef, useState } from "react";',
  'import { Suspense, useEffect, useMemo, useRef, useState } from "react";',
);

fs.writeFileSync(path, text);
console.log("simple page now totals from the itemized engine");
