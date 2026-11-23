"""Validates the rulebook workbook against the engine's imported rule data."""

import json
from pathlib import Path

from openpyxl import load_workbook

BOOK = Path(r"C:\Users\kimat\Downloads\ESTIMO_Quantity_Engine_Rulebook.xlsx")
DATA = Path(r"C:\Users\kimat\Desktop\ESTIMO\lib\data\quantity-engine")

problems: list[str] = []
notes: list[str] = []


def fail(sheet: str, row, message: str) -> None:
    where = f"{sheet} row {row}" if row else sheet
    problems.append(f"{where}: {message}")


def load(sheet_name: str) -> list[list]:
    sheet = book[sheet_name]
    rows = []
    for row in sheet.iter_rows(values_only=True):
        if all(cell is None or str(cell).strip() == "" for cell in row):
            continue
        rows.append(list(row))
    # drop title and header lines: first row is a title, second is the header
    data = [row for row in rows[2:] if row and isinstance(row[0], str) and row[0].strip()]
    return data


book = load_workbook(BOOK, data_only=True)
required_sheets = [
    "Global Parameters",
    "Room Rules",
    "Templates",
    "Template Spaces",
    "Special Loads",
    "Circuit Rules",
    "Assemblies",
    "Assembly Items",
    "Expected Outputs",
    "Developer Notes",
]
for name in required_sheets:
    if name not in book.sheetnames:
        problems.append(f"missing sheet: {name}")

params = load("Global Parameters")
rooms = load("Room Rules")
templates = load("Templates")
spaces = load("Template Spaces")
loads = load("Special Loads")
circuits = load("Circuit Rules")
assemblies = load("Assemblies")
assembly_items = load("Assembly Items")
expected = load("Expected Outputs")

notes.append(f"counts: params {len(params)}, rooms {len(rooms)}, templates {len(templates)}, spaces {len(spaces)}, loads {len(loads)}, circuits {len(circuits)}, assemblies {len(assemblies)}, assembly items {len(assembly_items)}, expected {len(expected)}")

# ---- global parameters
keys = [row[0] for row in params]
if len(keys) != len(set(keys)):
    problems.append("Global Parameters: duplicate keys")
for index, row in enumerate(params, start=3):
    if not isinstance(row[1], (int, float)):
        fail("Global Parameters", index, f"{row[0]} value is not numeric: {row[1]!r}")
    if not row[2]:
        fail("Global Parameters", index, f"{row[0]} has no unit")

# ---- room rules
specs = {"economy", "standard", "premium"}
room_types = sorted({row[0] for row in rooms})
for room_type in room_types:
    covered = {row[1] for row in rooms if row[0] == room_type}
    if covered != specs:
        fail("Room Rules", None, f"{room_type} covers {sorted(covered)} not all three specs")

# column 2 (area per point) may be blank where the rule is length-driven (corridor);
# column 4 (socket spacing) may be blank where no general socket rule applies.
required_numeric = (3, 5, 6, 8, 9)
optional_numeric = (2, 4)
for index, row in enumerate(rooms, start=3):
    for column in required_numeric:
        if not isinstance(row[column], (int, float)) or row[column] < 0:
            fail("Room Rules", index, f"{row[0]}/{row[1]} column {column} must be a number: {row[column]!r}")
    for column in optional_numeric:
        if row[column] is not None and (not isinstance(row[column], (int, float)) or row[column] <= 0):
            fail("Room Rules", index, f"{row[0]}/{row[1]} column {column} must be blank or positive: {row[column]!r}")
    if row[7] not in {"yes", "no", "optional"}:
        fail("Room Rules", index, f"{row[0]}/{row[1]} ac_default {row[7]!r} is not yes/no/optional")
    if row[3] < 1:
        fail("Room Rules", index, f"{row[0]}/{row[1]} minimum lighting points below 1")
    if row[2] is None and not row[10]:
        fail("Room Rules", index, f"{row[0]}/{row[1]} has no area rule and no note explaining it")

# ---- templates
ids = [row[0] for row in templates]
if len(ids) != len(set(ids)):
    problems.append("Templates: duplicate template ids")
allowed_types = {"container_kiosk", "single_room", "one_bedroom", "two_bedroom", "three_bedroom", "four_bedroom_villa", "shop_retail", "office", "workshop_small_factory"}
for index, row in enumerate(templates, start=3):
    if row[1] not in allowed_types:
        fail("Templates", index, f"{row[0]} has unknown project_type {row[1]!r}")
    if row[3] not in {"compact", "standard", "large"}:
        fail("Templates", index, f"{row[0]} has unknown size_class {row[3]!r}")
by_type: dict[str, int] = {}
for row in templates:
    by_type[row[1]] = by_type.get(row[1], 0) + 1
for project_type, count in by_type.items():
    if count != 3:
        fail("Templates", None, f"{project_type} has {count} templates, expected 3")

# ---- template spaces
template_ids = set(ids)
for index, row in enumerate(spaces, start=3):
    if row[0] not in template_ids:
        fail("Template Spaces", index, f"unknown template {row[0]!r}")
    if row[3] not in room_types:
        fail("Template Spaces", index, f"{row[0]}/{row[2]} room_type {row[3]!r} is not in Room Rules")
    for column, label in ((4, "length"), (5, "width"), (6, "height")):
        if not isinstance(row[column], (int, float)) or row[column] <= 0:
            fail("Template Spaces", index, f"{row[0]}/{row[2]} {label} invalid: {row[column]!r}")
    if not isinstance(row[7], (int, float)) or row[7] < 1:
        fail("Template Spaces", index, f"{row[0]}/{row[2]} quantity invalid: {row[7]!r}")
    for column, label in ((8, "workstations"), (9, "checkout_counters"), (10, "machine_count")):
        if row[column] is not None and (not isinstance(row[column], (int, float)) or row[column] < 0):
            fail("Template Spaces", index, f"{row[0]}/{row[2]} {label} invalid: {row[column]!r}")
space_counts: dict[str, int] = {}
for row in spaces:
    space_counts[row[0]] = space_counts.get(row[0], 0) + 1
for template_id in ids:
    if space_counts.get(template_id, 0) == 0:
        fail("Template Spaces", None, f"{template_id} has no spaces")

# ---- special loads
load_keys = [row[0] for row in loads]
if len(load_keys) != len(set(load_keys)):
    problems.append("Special Loads: duplicate load keys")
contexts = {"kitchen", "kitchen_or_utility", "kitchen_or_bathroom", "bathroom", "habitable_room", "building", "external", "garage", "workshop", "shop_or_workshop"}
for index, row in enumerate(loads, start=3):
    if row[1] not in contexts:
        fail("Special Loads", index, f"{row[0]} context {row[1]!r} unknown")
    if row[2] not in {"optional", "user_select", "user_defined"}:
        fail("Special Loads", index, f"{row[0]} selection_mode {row[2]!r} unknown")
    if not isinstance(row[3], bool):
        fail("Special Loads", index, f"{row[0]} default_enabled is not boolean: {row[3]!r}")
    if row[4] not in {"dedicated", "dedicated_or_shared", "dedicated_or_design_rule"}:
        fail("Special Loads", index, f"{row[0]} circuit_policy {row[4]!r} unknown")

# ---- circuit rules
for index, row in enumerate(circuits, start=3):
    if not isinstance(row[2], (int, float)) or row[2] <= 0:
        fail("Circuit Rules", index, f"{row[0]}/{row[1]} limit invalid: {row[2]!r}")

# ---- assemblies and items
assembly_keys = {row[0] for row in assemblies}
if len(assembly_keys) != len(assemblies):
    problems.append("Assemblies: duplicate assembly keys")

engine_catalogue = json.loads((Path(r"C:\Users\kimat\Desktop\ESTIMO\lib\quantity-engine\catalogue.ts")).read_text(encoding="utf8").split("MATERIAL_CATALOGUE: Record<string, CatalogueLink> = {", 1)[1].split("\n};", 1)[0].count(": {") and "{}" or "{}")
material_keys = set()
catalogue_source = Path(r"C:\Users\kimat\Desktop\ESTIMO\lib\quantity-engine\catalogue.ts").read_text(encoding="utf8")
import re
for match in re.finditer(r'^\s{2}"?([\w.]+)"?:\s*\{', catalogue_source, re.M):
    material_keys.add(match.group(1))

for index, row in enumerate(assembly_items, start=3):
    if row[0] not in assembly_keys:
        fail("Assembly Items", index, f"unknown assembly {row[0]!r}")
    if row[1] not in material_keys:
        fail("Assembly Items", index, f"material {row[1]!r} not in the engine catalogue map")
    if row[4] not in {"fixed", "route_driven"}:
        fail("Assembly Items", index, f"{row[0]}/{row[1]} quantity_mode {row[4]!r} unknown")

# ---- expected outputs
if len(expected) != 27:
    problems.append(f"Expected Outputs: {len(expected)} rows, expected 27")

expected_ids = [row[0] for row in expected]
if len(expected_ids) != len(set(expected_ids)):
    problems.append("Expected Outputs: duplicate template ids")

space_area: dict[str, float] = {}
for row in spaces:
    space_area[row[0]] = space_area.get(row[0], 0.0) + row[4] * row[5] * (row[7] or 1)

for index, row in enumerate(expected, start=3):
    template_id = row[0]
    if template_id not in template_ids:
        fail("Expected Outputs", index, f"{template_id} is not a template")
        continue
    if abs((row[4] or 0) - space_area.get(template_id, 0)) > 0.15:
        fail("Expected Outputs", index, f"{template_id} floor area {row[4]} != spaces total {round(space_area.get(template_id, 0), 1)}")
    circuit_sum = (row[12] or 0) + (row[13] or 0) + (row[14] or 0) + (row[15] or 0)
    if row[16] != circuit_sum:
        fail("Expected Outputs", index, f"{template_id} total circuits {row[16]} != sum {circuit_sum}")
    if isinstance(row[17], str):
        fail("Expected Outputs", index, f"{template_id} DB ways is text: {row[17]!r}")

expected_file = DATA / "expected_template_outputs_standard.json"

# ---- value-by-value comparison with the imported data
checked_fields = 0


def compare(label: str, workbook_rows: list[list], json_rows: list[dict], fields: list[tuple[str, int]]) -> None:
    global checked_fields
    if len(workbook_rows) != len(json_rows):
        problems.append(f"{label}: {len(workbook_rows)} workbook rows vs {len(json_rows)} imported")
        return
    for index, (wb_row, json_row) in enumerate(zip(workbook_rows, json_rows), start=3):
        for key, column in fields:
            expected_value = wb_row[column]
            actual_value = json_row.get(key)
            if isinstance(expected_value, float) and isinstance(actual_value, (int, float)):
                same = abs(expected_value - actual_value) < 1e-9
            else:
                same = expected_value == actual_value
            if not same:
                problems.append(f"{label} row {index}: {key} is {actual_value!r} imported, {expected_value!r} in the workbook")
                return
            checked_fields += 1


compare(
    "global_parameters.json",
    params,
    json.loads((DATA / "global_parameters.json").read_text(encoding="utf8")),
    [("key", 0), ("value", 1), ("unit", 2)],
)
compare(
    "room_rules.json",
    rooms,
    json.loads((DATA / "room_rules.json").read_text(encoding="utf8")),
    [
        ("room_type", 0),
        ("spec_level", 1),
        ("lighting_area_per_point_m2", 2),
        ("minimum_lighting_points", 3),
        ("socket_spacing_perimeter_m", 4),
        ("minimum_double_sockets", 5),
        ("fan_points_default", 6),
        ("ac_default", 7),
        ("tv_points_default", 8),
        ("data_points_default", 9),
    ],
)
compare(
    "structure_templates.json",
    templates,
    json.loads((DATA / "structure_templates.json").read_text(encoding="utf8")),
    [("template_id", 0), ("project_type", 1), ("template_name", 2), ("size_class", 3)],
)
compare(
    "template_spaces.json",
    spaces,
    json.loads((DATA / "template_spaces.json").read_text(encoding="utf8")),
    [
        ("template_id", 0),
        ("space_no", 1),
        ("space_name", 2),
        ("room_type", 3),
        ("length_m", 4),
        ("width_m", 5),
        ("height_m", 6),
        ("quantity", 7),
        ("workstations", 8),
        ("checkout_counters", 9),
        ("machine_count", 10),
    ],
)
compare(
    "special_loads.json",
    loads,
    json.loads((DATA / "special_loads.json").read_text(encoding="utf8")),
    [
        ("load_key", 0),
        ("space_context", 1),
        ("selection_mode", 2),
        ("default_enabled", 3),
        ("circuit_policy", 4),
    ],
)
compare(
    "circuit_rules.json",
    circuits,
    json.loads((DATA / "circuit_rules.json").read_text(encoding="utf8")),
    [("circuit_type", 0), ("project_context", 1), ("limit_value", 2), ("limit_basis", 3)],
)
compare(
    "assemblies.json",
    assemblies,
    json.loads((DATA / "assemblies.json").read_text(encoding="utf8")),
    [("assembly_key", 0), ("name", 1), ("assembly_type", 2)],
)
compare(
    "assembly_items.json",
    assembly_items,
    json.loads((DATA / "assembly_items.json").read_text(encoding="utf8")),
    [("assembly_key", 0), ("material_key", 1), ("quantity", 2), ("unit", 3), ("quantity_mode", 4)],
)
if expected_file.exists():
    compare(
        "expected_template_outputs_standard.json",
        expected,
        json.loads(expected_file.read_text(encoding="utf8")),
        [
            ("template_id", 0),
            ("spec_level", 3),
            ("floor_area_sum_m2", 4),
            ("lighting_points", 5),
            ("double_sockets", 6),
            ("fan_points", 7),
            ("ac_points_default", 8),
            ("tv_points", 9),
            ("data_points", 10),
            ("switch_positions", 11),
            ("lighting_circuits", 12),
            ("socket_circuits", 13),
            ("machine_circuits", 14),
            ("ac_circuits", 15),
            ("total_final_circuits", 16),
        ],
    )
# ---- imported data must match the workbook
mapping = {
    "global_parameters.json": "Global Parameters",
    "room_rules.json": "Room Rules",
    "structure_templates.json": "Templates",
    "template_spaces.json": "Template Spaces",
    "special_loads.json": "Special Loads",
    "circuit_rules.json": "Circuit Rules",
    "assemblies.json": "Assemblies",
    "assembly_items.json": "Assembly Items",
}
expected_file = DATA / "expected_template_outputs_standard.json"

for file_name, sheet_name in mapping.items():
    path = DATA / file_name
    if not path.exists():
        problems.append(f"{file_name} missing from imported data")
        continue
    imported = json.loads(path.read_text(encoding="utf8"))
    if len(imported) != len(load(sheet_name)):
        problems.append(f"{file_name}: {len(imported)} rows imported, workbook has {len(load(sheet_name))}")

expected_file = DATA / "expected_template_outputs_standard.json"
if expected_file.exists():
    imported_expected = json.loads(expected_file.read_text(encoding="utf8"))
    if len(imported_expected) != len(expected):
        problems.append(f"expected_template_outputs_standard.json: {len(imported_expected)} rows imported, workbook has {len(expected)}")
else:
    problems.append("expected_template_outputs_standard.json missing")

print("VALIDATION")
print("\n".join(f"  - {note}" for note in notes))
print(f"\nfields compared: {checked_fields}")
print(f"problems: {len(problems)}")
for problem in problems:
    print(f"  ! {problem}")
if not problems:
    print("  everything checked out")
