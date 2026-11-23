import type { Metadata } from "next";
import Link from "next/link";
import { CATALOGUE_MATERIALS } from "@/lib/data/catalogue";
import { getCatalogueData } from "@/lib/api/catalogue-prices";
import { listTemplates, PROJECT_TYPES, RULE_SET, getTemplateSpaces } from "@/lib/quantity-engine";
import { MATERIAL_CATALOGUE } from "@/lib/quantity-engine/catalogue";
import globalParameters from "@/lib/data/quantity-engine/global_parameters.json";
import roomRules from "@/lib/data/quantity-engine/room_rules.json";
import circuitRules from "@/lib/data/quantity-engine/circuit_rules.json";
import assemblies from "@/lib/data/quantity-engine/assemblies.json";
import assemblyItems from "@/lib/data/quantity-engine/assembly_items.json";
import { parametersFromRows } from "@/lib/quantity-engine/engine";
import { QuantityView } from "@/components/quantities/quantity-view";

export const metadata: Metadata = {
  title: "Material quantities — ESTIMO",
  description:
    "Estimate the electrical materials a project needs: points, circuits, conduit and cable, priced against the ESTIMO catalogue.",
};

export default async function QuantitiesPage() {
  const templates = listTemplates();
  const spacesByTemplate = Object.fromEntries(
    templates.map((template) => [template.id, getTemplateSpaces(template.id)]),
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
          <p className="eyebrow">Material quantities</p>
          <h1 className="quantities-title">What the job actually needs.</h1>
          <p className="quantities-lead">
            Pick the closest project, adjust the rooms, and ESTIMO works out the points, circuits, conduit and
            cable — then prices them against the catalogue.
          </p>
          <p className="quantities-ruleset">
            Rule set <strong>{RULE_SET}</strong> · preliminary estimating quantities, not a design
          </p>
        </div>
      </section>

      <div className="container quantities-body">
        <QuantityView
          projectTypes={PROJECT_TYPES.map((type) => ({ key: type.key, label: type.label }))}
          templates={templates}
          spacesByTemplate={spacesByTemplate}
          rules={roomRules}
          params={parametersFromRows(globalParameters)}
          circuitRules={circuitRules}
          assemblies={assemblies}
          assemblyItems={assemblyItems}
          catalogue={catalogue}
          prices={prices}
        />

        <section className="quantities-note">
          <h2>How these numbers are produced</h2>
          <p>
            Lights follow the room area and the chosen specification; sockets follow the wall perimeter; offices
            add a socket per workstation, shops add two per counter, workshops add a circuit per machine. Circuits
            are grouped to the rule limits, a board way is chosen with spare capacity, and the conduit and cable
            come from the room perimeters with the allowances in the rule set.
          </p>
          <p>
            Quantities are for budgeting. Cable sizes for machines, protection coordination and earthing design
            still need a qualified electrician — see <Link href="/catalogue">the catalogue</Link> for current
            material prices.
          </p>
        </section>
      </div>
    </main>
  );
}
