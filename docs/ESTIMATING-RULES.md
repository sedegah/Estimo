# Estimating rules

The rules the estimate applies on its own, beyond the room geometry. They live in code so
the simple summary, the itemized bill and the PDF cannot disagree about them.

## One price, one source

The itemized bill is the source of truth for money. It publishes its priced lines and total
into the shared draft (`estimo_estimate_draft_v1`), and the simple estimate prints that bill
rather than pricing the plan its own way. A plan that has never been opened itemized is
priced with the same engine and the same catalogue, so the two agree from the first render.
Editing a counter on the simple page drops the carried bill and prices the counters again.

The specification travels with the bill. Choosing Premium (or Standard, or Economy) in the
itemized bill writes that choice into the draft, and the simple page adopts it on return, so
the fittings label and the price always describe the same specification. Changing the
fittings on the simple page keeps the plan but drops the bill, prices it again at the new
specification, and hands that choice to the itemized screen for its next visit.

## Washrooms

Offices, shops and workshops must provide at least two washrooms: staff and customers cannot
share one, and the layouts are planned with two.

- `MINIMUM_WASHROOMS` in `lib/estimate-model.ts` sets the floor (office, shop, workshop).
- `defaultCounts` starts the counters there, and `clampCount` stops a stepper going below it.
- The templates carry the same floor: every office, shop and workshop template has two or
  more WC/bathroom spaces, so the itemized bill satisfies the rule without any counters.
- Homes and kiosks are unaffected.

## Fans

A fan point used to buy a switch and a length of cable, but never the fan. Each fan point now
carries:

| Material | Engine key | Catalogue item |
| --- | --- | --- |
| Ceiling fan | `ceiling_fan` | `mat-fan-ceiling-56` (allowance) |
| Speed regulator | `fan_regulator` | `mat-fan-regulator` |
| Hook and cover | `fan_hook` | `mat-fan-hook` |

Quantities follow the fan count in the Points table, so a plan with three fans buys three of
each. The catalogue items are allowance rates (`ALLOWANCE_PRICES_GHS`): a published supplier
price always wins, and the bill labels the allowance brand so nobody mistakes it for a
quotient. Fans are a line item in every estimate, not an unstated assumption.

## Special loads and air conditioning

See `docs/SPECIAL-LOADS.md`. The configurator follows the handoff's four configuration
states, with its labels: `Configuration required`, `Estimated`, `Verified` and
`User override`. The priority is manufacturer instructions, then an approved professional
override, then ESTIMO's provisional sizing, then unresolved.

Motor loads — air conditioners, pumps, workshop machines and refrigeration plant — are run
in 2.5 mm² minimum, whatever the design current allows. That is what the trade installs, and
it stops a small unit being wired in a size that is only nominally adequate.

Air conditioners counted in the Points table are the quantity of the configured AC load. The
engine's generic AC point is switched off while that load covers it, so the same unit is
never costed twice.

Defaults: a home is planned with one unit per bedroom and living room, except a single room.
An office is planned with one unit in every room except the washrooms, including the
reception and the server room. A row that stands for several rooms (three private offices)
contributes one unit per room, not one per row.

Every planned unit is **2 HP** (1.8 kW, 16 A, 2.5 mm²) until someone opens the load and
chooses a different rating; the card reads "Estimated" until a manufacturer figure is
entered. A single room gets no AC by default, because there is nowhere external to put one.


One AC line covers every cooled room, so its route is the mean of the runs to those rooms —
weighted by how many units each row represents. The card says so ("average of 9 rooms").
That keeps the price independent of which room happens to sort first, and the total cable on
the line equals the sum of the individual runs.

The EV charger is set in the compound (external), preferring the yard/porch over a carport,
and carries its own double-pole breaker per unit alongside a 30 mA RCD and a local isolator.


## Price-list checks

The estimate refuses to be quietly wrong about cable. If a smaller conductor is published at
more than 1.5× the next size up, the itemized bill carries a warning naming both prices, for
example:

> Catalogue price check: 1.5 mm² copper single-core is GHS 25.00/m but 2.5 mm² copper
> single-core is GHS 6.00/m. The smaller cable is priced higher, so small circuits look
> dearer than large ones; check the price list.

That warning is what explained a 1 HP air conditioner out-pricing a 2.5 HP one until the
catalogue row was corrected. The 1.5 mm² copper single-core row was corrected on
26 November 2026 (GHS 25.00 → 3.50/m, from the November research note of ₵145–380 per 90 m)
by `lib/db/migrations/0005_fix-cable-prices.sql`; the November seed carries the same figure
so a fresh database starts correct. Prices are effective-dated, so the old row remains in
the history and the newest `effective_from` wins.

The catalogue response is cached (60 s in the browser, 300 s at the edge), so a price
correction can take up to five minutes to appear on screens that are already open.

## Saved projects

The saved list is ordered by the **last save**, not the first: saving an existing project
again moves it to the top. Cards show the project priced at **today's** catalogue prices,
using the same engine and the same defaults as the estimate itself, so a catalogue
correction updates the card as well as the bill. The stored total remains as the record of
what was saved.

A visitor who is not signed in saves to this browser, and the button that appears says
"Saved estimates" and opens `/saved` — a public list of what this browser holds, priced at
today's catalogue, with Open and Delete. Signed-in users keep `/projects`, which merges the
account's copies.

## Estimate codes

Every saved estimate carries a short code such as `EST-7K3M9Q` (no I, O, 0 or 1, so it can be
read out). Estimates saved before codes existed are given one the first time the list is
read, and the code is written back, so it never changes afterwards. The code is shown on the
card in both lists, included in the projects search, and `/saved` can open an estimate from a
typed code. Opening a saved estimate restores its own template variant and specification —
the itemized bill is the saved plan, not the project type's defaults.
