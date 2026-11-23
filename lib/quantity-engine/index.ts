/**
 * Public API of the ESTIMO quantity engine.
 *
 * UI and routes call these functions; the underlying rule data lives in
 * lib/data/quantity-engine and can be edited without touching this file.
 */

import globalParameters from "@/lib/data/quantity-engine/global_parameters.json";
import roomRules from "@/lib/data/quantity-engine/room_rules.json";
import circuitRules from "@/lib/data/quantity-engine/circuit_rules.json";
import structureTemplates from "@/lib/data/quantity-engine/structure_templates.json";
import templateSpacesData from "@/lib/data/quantity-engine/template_spaces.json";
import assemblies from "@/lib/data/quantity-engine/assemblies.json";
import assemblyItems from "@/lib/data/quantity-engine/assembly_items.json";
import specialLoads from "@/lib/data/quantity-engine/special_loads.json";

import { calculateProject, parametersFromRows, rulesByKey, templateSpaces } from "./engine";
import type {
  CircuitRuleRow,
  EngineResult,
  GlobalParameterRow,
  PointOverride,
  RoomRuleRow,
  SpaceInput,
  SpecLevel,
  StructureTemplateRow,
  TemplateSpaceRow,
} from "./types";

export { RULE_SET, DB_SIZES } from "./engine";
export { CONFIDENCE_NOTE, MATERIAL_CATALOGUE, priceQuantities } from "./catalogue";
export type { CatalogueMaterialInfo, PriceEntry, PricedLine } from "./catalogue";
export type { EngineResult, MaterialQuantity, PointOverride, SpaceInput, SpecLevel } from "./types";

export const PROJECT_TYPES = [
  { key: "container_kiosk", label: "Container / Kiosk" },
  { key: "single_room", label: "Single Room" },
  { key: "one_bedroom", label: "1-Bedroom Home" },
  { key: "two_bedroom", label: "2-Bedroom Home" },
  { key: "three_bedroom", label: "3-Bedroom Home" },
  { key: "four_bedroom_villa", label: "4-Bedroom / Villa" },
  { key: "office", label: "Office" },
  { key: "shop_retail", label: "Shop / Retail" },
  { key: "workshop_small_factory", label: "Workshop / Small Factory" },
] as const;

export const SPEC_LEVELS: { key: SpecLevel; label: string; hint: string }[] = [
  { key: "economy", label: "Economy", hint: "Fewer points, tighter budget" },
  { key: "standard", label: "Standard", hint: "The usual ESTIMO specification" },
  { key: "premium", label: "Premium", hint: "More points, more comfort" },
];

const templates = structureTemplates as unknown as StructureTemplateRow[];
const spaces = templateSpacesData as unknown as TemplateSpaceRow[];
const params = parametersFromRows(globalParameters as unknown as GlobalParameterRow[]);
const rules = rulesByKey(roomRules as unknown as RoomRuleRow[]);

export interface TemplateSummary {
  id: string;
  name: string;
  projectType: string;
  sizeClass: string;
  description: string;
  spaceCount: number;
}

export function listTemplates(projectType?: string): TemplateSummary[] {
  return templates
    .filter((template) => !projectType || template.project_type === projectType)
    .map((template) => ({
      id: template.template_id,
      name: template.template_name,
      projectType: template.project_type,
      sizeClass: template.size_class,
      description: template.description,
      spaceCount: spaces.filter((space) => space.template_id === template.template_id).length,
    }));
}

export function getTemplate(templateId: string): TemplateSummary | null {
  return listTemplates().find((template) => template.id === templateId) ?? null;
}

/** Template spaces as editable inputs, ready for the UI. */
export function getTemplateSpaces(templateId: string): SpaceInput[] {
  const template = templates.find((entry) => entry.template_id === templateId);
  if (!template) return [];
  return templateSpaces(template, spaces);
}

export interface CalculateOptions {
  templateId?: string | null;
  projectType?: string;
  specLevel: SpecLevel;
  spaces?: SpaceInput[];
  overrides?: PointOverride[];
}

export function calculate(options: CalculateOptions): EngineResult {
  const template = options.templateId
    ? templates.find((entry) => entry.template_id === options.templateId)
    : undefined;
  const projectType = options.projectType ?? template?.project_type ?? "two_bedroom";
  const spaceInputs = options.spaces?.length
    ? options.spaces
    : template
      ? templateSpaces(template, spaces)
      : [];

  return calculateProject({
    spaces: spaceInputs,
    specLevel: options.specLevel,
    projectType,
    templateId: template?.template_id ?? null,
    overrides: options.overrides ?? [],
    params,
    rules,
    circuitRules: circuitRules as unknown as CircuitRuleRow[],
    assemblies: assemblies as unknown as AssemblyRow[],
    assemblyItems: assemblyItems as unknown as AssemblyItemRow[],
  });
}

/** Room rules for the given spec level, for the rules panel. */
export function roomRulesFor(specLevel: SpecLevel): RoomRuleRow[] {
  return (roomRules as unknown as RoomRuleRow[]).filter((rule) => rule.spec_level === specLevel);
}

export const specialLoadsCatalog = specialLoads;
export const globalParameterRows = globalParameters as unknown as GlobalParameterRow[];
