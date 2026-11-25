# Special loads

A special load is anything the estimate cannot count from room geometry: a water heater, an
EV charger, a freezer, a workshop machine. Selecting one used to add a circuit and a label,
but no priced materials, so the chip looked included while it cost nothing.

The configurator fixes that. Choosing a load opens a form for that load; filling it in
produces a circuit, a route and the materials the circuit needs, and those materials join
the bill of quantities and the total.

```
selected load → configurator → instance → circuit → route → assembly
             → material quantities → pricing → estimate total
```

## Where the code lives

| File | Job |
| --- | --- |
| `lib/quantity-engine/special-loads.ts` | Load definitions (fields, presets, policies), sizing, material expansion, `applySpecialLoads` |
| `components/quantities/special-load-configurator.tsx` | The modal, rendered from the definition |
| `components/quantities/quantity-view.tsx` | Chips, status, per-load cost, wiring the configurator into the take-off |
| `lib/quantity-engine/catalogue.ts` | Engine material key → catalogue material, so a load's rows can be priced |
| `tests/special-load-configurator.test.ts` | The acceptance list from the handoff, as tests |

The quantity engine itself (`engine.ts`) is untouched. `applySpecialLoads(result, instances)`
adds the configured loads on top of the engine result: their circuits, their materials and
their cautions. That separation is deliberate — changing how a heater is sized can never
move the golden quantity outputs in `tests/quantity-engine.test.ts`.

## The three states

| State | Label in the UI | What it means |
| --- | --- | --- |
| `NOT_CONFIGURED` | Configuration required | Selected, but missing a required field. Contributes no materials and no cost, and the estimate says so. |
| `PROVISIONAL` | Estimated | Rating and route known; ESTIMO's sizing used. Materials are costed and the caution is shown. |
| `VERIFIED` | Fully specified | The manufacturer's cable and breaker are entered. Those figures beat ESTIMO's. |
| `OVERRIDDEN` | Professional override | A qualified person decided the circuit. Costed, and labelled as a judgement call. |

A chip never shows a cost it has not earned: an unconfigured load shows `—`, not `GHS 0.00`.

## Sizing

Everything below is a provisional engineering allowance, not a design.

- **Current**: `I = P / (V × pf)`, or `P / (√3 × V × pf)` three-phase. A rated current, when
  given, is used directly. Power factors: 1.0 for heaters and cookers, 0.9 for air
  conditioning and refrigeration, 0.85 for pumps, gate motors and machines.
- **Air conditioners**: entered in HP. ESTIMO converts at 0.9 kW input per HP and says that
  the manual's input power should replace it.
- **Missing rating**: the rulebook figure from `special_loads.json` is used and the estimate
  says it was assumed.
- **Protective device**: smallest standard rating at or above the design current, with a
  1.25 factor for motors. Manufacturer ratings win. 63 A is the largest device the catalogue
  prices; beyond that the basis says an engineered device is needed.
- **Cable**: smallest copper size from the capacity table whose derated capacity covers the
  device. Method factors: conduit 0.8, concealed 0.8, trunking 0.9, surface 1.0. The
  protective conductor matches the phase conductor up to 16 mm².
- **RCD**: required when the manufacturer says so, or when the load type requires it by
  policy (EV chargers). Otherwise the choice is recorded, not invented.
- **Isolator**: fitted where the load type or the person asks for local isolation.
- **Own circuit**: a load that shares an existing appliance circuit (the freezer's plug-in
  preset) still gets its outlet, cable and containment, but no board device, no isolator,
  and no new way on the distribution board.

## Materials a configured load adds

Per unit, multiplied by the quantity entered:

- the protective device (and a 30 mA RCD where required), for a load with its own circuit
- a local isolator where required
- the load-end accessory: double socket and box, fused spur, or cooker switch and outlet
- phase, neutral and protective conductors for the route, plus 1.5 m per circuit for terminations
- conduit (20/25/32 mm by cable size) or trunking, with its waste
- conduit couplers, bends and draw boxes at the engine's rates per metre
- two terminations per circuit, sized with the protective conductor

Waste comes from the project's global parameters, so a configurator quantity and a
point-driven quantity use the same allowances.

## Routes

- A load starts on the space the rulebook context points at, and takes that space's
  published distance from `template_space_routes.json` (`route_source = AUTO`).
- Typing a distance sets `route_source = USER_OVERRIDE`; the plan no longer overwrites it.
- "Use the ESTIMO distance" in the form puts it back to automatic.
- Changing template or removing the space re-points the load at the closest remaining space
  rather than keeping an orphan id.

## Pricing

A special load is not costed until its material quantities reach `project_material_quantities`.
`priceQuantities` then prices them from the catalogue exactly like the rest of the take-off.
A row with no published price stays on the bill marked Pending and is excluded from the
total: a missing price is never treated as GHS 0. Each load card shows its own subtotal and
how many of its lines are unpriced; the section header sums those cards.

The bill is priced on measured quantities: a metre of cable costs a metre, and conduit is
rounded up to the 3 m lengths it is sold in. Pack sizes exist in the engine (`pack_size`)
for purchasing, but they never multiply the estimate, so a load's cost is never hidden
inside a drum the plan had already paid for. The card and the table therefore use the same
arithmetic and reconcile.

## Persistence

- The working estimate keeps whole instances in `estimo_estimate_draft_v1`;
  older drafts that stored only load keys are migrated on read.
- A saved estimate carries `quantities.specialLoadInstances` (snapshot version 2), so
  reopening it keeps the ratings, routes and manufacturer figures.
- The PDF prints the configured summary per load (`specialLoadSummaries`) instead of the old
  "concluded by phone call or WhatsApp" line. Bare load keys still print as before.

## Adding a load type

1. Add a definition to `SPECIAL_LOAD_DEFINITIONS` in `lib/quantity-engine/special-loads.ts`:
   fields, presets, required keys, and the material policy (`outlet`, `protection`, `rcd`,
   `isolator`, `containment`, `fallbackPowerKw`).
2. Add the row to `lib/data/quantity-engine/special_loads.json` so it is offered for the
   right room contexts, with its `assembly_key`.
3. If the definition can emit a material key the catalogue does not know, add it to
   `MATERIAL_CATALOGUE` in `catalogue.ts`; otherwise the line cannot be priced and will not
   appear on the estimate.
4. Add the load's acceptance case to `tests/special-load-configurator.test.ts`.
