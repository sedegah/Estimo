import type { Metadata } from "next";
import Link from "next/link";
import { CATALOGUE_MATERIALS } from "@/lib/data/catalogue";
import { getCatalogueData } from "@/lib/api/catalogue-prices";
import { listTemplates, PROJECT_TYPES, getTemplateSpaces } from "@/lib/quantity-engine";
import { MATERIAL_CATALOGUE } from "@/lib/quantity-engine/catalogue";
import globalParameters from "@/lib/data/quantity-engine/global_parameters.json";
import roomRules from "@/lib/data/quantity-engine/room_rules.json";
import circuitRules from "@/lib/data/quantity-engine/circuit_rules.json";
import assemblies from "@/lib/data/quantity-engine/assemblies.json";
import assemblyItems from "@/lib/data/quantity-engine/assembly_items.json";
import specialLoads from "@/lib/data/quantity-engine/special_loads.json";
import { parametersFromRows } from "@/lib/quantity-engine/engine";
import type { AssemblyItemRow, AssemblyRow, RoomRuleRow } from "@/lib/quantity-engine/types";
import { QuantityView } from "@/components/quantities/quantity-view";
import { hasSessionCookie } from "@/lib/auth-cookie";

export const metadata: Metadata = {
  title: "Itemized estimate — ESTIMO",
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

/** Building type label for the header line, keyed by the home page code. */
const PROJECT_TYPE_FOR_CODE: Record<string, string> = {
  "HOME-1R": "single_room",
  "HOME-1B": "one_bedroom",
  "HOME-2B": "two_bedroom",
  "HOME-3B": "three_bedroom",
  "HOME-4B": "four_bedroom_villa",
  "SHOP-KIOSK": "container_kiosk",
  "SHOP-RETAIL": "shop_retail",
  "COMM-OFF-S": "office",
  "IND-WORK": "workshop_small_factory",
};

export default async function QuickEstimatePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; quality?: string }>;
}) {
  const { template, quality } = await searchParams;
  const signedIn = await hasSessionCookie();
  const code = template ?? "HOME-2B";
  const templateId = TEMPLATE_FOR_CODE[code] ?? "T011";

  const templates = listTemplates();
  const spacesByTemplate = Object.fromEntries(
    templates.map((entry) => [entry.id, getTemplateSpaces(entry.id)]),
  );

  const specLevelFromQuality = quality === "premium" ? "premium" : quality === "basic" ? "economy" : "standard";
  const projectType = PROJECT_TYPE_FOR_CODE[code] ?? "two_bedroom";
  const projectLabel = PROJECT_TYPES.find((type) => type.key === projectType)?.label ?? "2-Bedroom Home";
  const templateLabel = templates.find((entry) => entry.id === templateId)?.name ?? "";

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

  // prices are fetched by the client after paint, so the estimate opens instantly
  const prices: Record<string, { price: number; brand: string | null; source: string | null; updatedAt: string | null }> = {};

  return (
    <main className="quantities-page">
      <section className="quantities-hero">
        <div className="container">
          <p className="eyebrow">Your estimate</p>
          <h1 className="quantities-title">What the job needs.</h1>
          <p className="quantities-meta">{projectLabel} · {templateLabel}</p>
          <p className="quantities-switch">
            <Link href={`/quick-estimate?template=${encodeURIComponent(code)}`}>Simple estimate</Link>
            <span>·</span>
            <span>Itemized</span>
          </p>
        </div>
      </section>

      <div className="container quantities-body">
        <QuantityView
          signedIn={signedIn}
          initialSpecLevel={specLevelFromQuality}
          templateCode={code}
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
          specialLoads={specialLoads}
        />
      </div>
    </main>
  );
}
