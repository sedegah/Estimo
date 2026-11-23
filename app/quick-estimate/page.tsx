import type { Metadata } from "next";
import { CATALOGUE_MATERIALS } from "@/lib/data/catalogue";
import { getCatalogueData } from "@/lib/api/catalogue-prices";
import { listTemplates, PROJECT_TYPES, getTemplateSpaces } from "@/lib/quantity-engine";
import { MATERIAL_CATALOGUE } from "@/lib/quantity-engine/catalogue";
import globalParameters from "@/lib/data/quantity-engine/global_parameters.json";
import roomRules from "@/lib/data/quantity-engine/room_rules.json";
import circuitRules from "@/lib/data/quantity-engine/circuit_rules.json";
import assemblies from "@/lib/data/quantity-engine/assemblies.json";
import assemblyItems from "@/lib/data/quantity-engine/assembly_items.json";
import { parametersFromRows } from "@/lib/quantity-engine/engine";
import type { AssemblyItemRow, AssemblyRow, RoomRuleRow } from "@/lib/quantity-engine/types";
import { QuantityView } from "@/components/quantities/quantity-view";

export const metadata: Metadata = {
  title: "Your estimate — ESTIMO",
  description: "Estimate the electrical materials for a project.",
};

/** Project rows on the home page use short codes; the engine has template ids. */
const TEMPLATE_FOR_CODE: Record<string, string> = {
  "HOME-1R": "T004",
  "HOME-1B": "T008",
  "HOME-2B": "T011",
  "HOME-3B": "T014",
  "HOME-4B": "T017",
  "SHOP-KIOSK": "T002",
  "SHOP-RETAIL": "T023",
  "COMM-OFF-S": "T020",
  "IND-WORK": "T026",
};

export default async function QuickEstimatePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  const code = template ?? "HOME-2B";
  const templateId = TEMPLATE_FOR_CODE[code] ?? "T011";

  const templates = listTemplates();
  const spacesByTemplate = Object.fromEntries(
    templates.map((entry) => [entry.id, getTemplateSpaces(entry.id)]),
  );

  const catalogueData = await getCatalogueData();
  const catalogueIds = new Set(
    Object.values(MATERIAL_CATALOGUE)
      .map((link) => link.id)
      .filter((id): id is string => Boolean(id)),
  );

  const catalogue = Object.fromEntries(
    CATALOGUE_MATERIALS.filter((material) => catalogueIds.has(material.id)).map((material) => [
      material.id,
      { id: material.id, name: material.name, unit: material.unit },
    ]),
  );

  const prices = Object.fromEntries(
    Object.entries(catalogueData.prices)
      .filter(([id]) => catalogueIds.has(id))
      .map(([id, entry]) => [id, { price: entry.price, brand: entry.brand, source: entry.source, updatedAt: entry.updatedAt }]),
  );

  return (
    <main className="quantities-page">
      <section className="quantities-hero">
        <div className="container">
          <p className="eyebrow">Your estimate</p>
          <h1 className="quantities-title">What the job needs.</h1>
        </div>
      </section>

      <div className="container quantities-body">
        <QuantityView
          initialTemplateId={templateId}
          estimateHref={`/estimate?template=${encodeURIComponent(code)}`}
          projectTypes={PROJECT_TYPES.map((type) => ({ key: type.key, label: type.label }))}
          templates={templates}
          spacesByTemplate={spacesByTemplate}
          rules={roomRules as unknown as RoomRuleRow[]}
          params={parametersFromRows(globalParameters)}
          circuitRules={circuitRules}
          assemblies={assemblies as unknown as AssemblyRow[]}
          assemblyItems={assemblyItems as unknown as AssemblyItemRow[]}
          catalogue={catalogue}
          prices={prices}
        />
      </div>
    </main>
  );
}
