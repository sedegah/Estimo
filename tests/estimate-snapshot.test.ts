/**
 * A saved estimate must survive the round trip to D1: the browser keeps a copy, the
 * server keeps the snapshot, and either can rebuild the same money.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { fromSnapshot, SNAPSHOT_VERSION, toSnapshot } from "../lib/estimate-snapshot.ts";
import { pricedCount, pricedTotal } from "../lib/estimate-total.ts";
import type { SavedEstimate } from "../lib/types.ts";

const saved: SavedEstimate = {
  id: "est-1",
  name: "2-Bedroom Standard estimate",
  kind: "quick",
  createdAt: "2026-11-23T18:00:00.000Z",
  detail: "2-Bedroom Standard · standard · 92.2 m² · 6 circuits",
  totalGhs: 18714.7,
  template: "HOME-2B",
  quality: "standard",
  counts: { lights: 14, sockets: 19, switches: 10, fans: 3, data: 1, spaces: 9 },
  items: [
    { name: "13A Double Switched Socket Outlet", quantity: 19, unit: "No.", priceGhs: 50 },
    { name: "20mm Heavy-Gauge PVC Conduit", quantity: 549, unit: "length", priceGhs: 8.5 },
    { name: "2.5mm² Copper Single-Core Cable", quantity: 800, unit: "m", priceGhs: 6 },
    { name: "Twin & Earth 1.5mm² Cable", quantity: 300, unit: "m", priceGhs: null },
  ],
  quantities: {
    templateId: "T011",
    specLevel: "standard",
    ruleSet: "ESTIMO-GH-QTY-v1.0",
    specialLoads: ["refrigerator", "water_heater"],
    spaces: [
      { id: "s1", space_name: "Living Room", room_type: "living_room", length_m: 5, width_m: 4.2, height_m: 3, quantity: 1 },
      { id: "s2", space_name: "Kitchen", room_type: "kitchen", length_m: 3.6, width_m: 3, height_m: 3, quantity: 1, workstations: 0 },
    ],
    overrides: [{ space_id: "s1", point_type: "fans", value: 1, source: "template" }],
  },
};

/** What D1 stores today: a JSON string in snapshot_json. */
const stored = JSON.stringify(toSnapshot(saved));

test("the snapshot carries the whole estimate, not just its summary", () => {
  const snapshot = toSnapshot(saved);
  assert.equal(snapshot.version, SNAPSHOT_VERSION);
  assert.equal(snapshot.items?.length, saved.items?.length);
  assert.equal(snapshot.quantities?.spaces.length, 2);
  assert.deepEqual(snapshot.quantities?.specialLoads, ["refrigerator", "water_heater"]);
  assert.equal(snapshot.quantities?.ruleSet, "ESTIMO-GH-QTY-v1.0");
});

test("a snapshot read back from the server rebuilds the same total", () => {
  const patch = fromSnapshot(JSON.parse(stored));
  assert.equal(patch.name, saved.name);
  assert.equal(patch.detail, saved.detail);
  assert.equal(patch.totalGhs, saved.totalGhs);
  assert.ok(patch.items, "items survive the trip");
  assert.equal(pricedTotal(patch.items ?? []), pricedTotal(saved.items ?? []));
  assert.equal(pricedCount(patch.items ?? []), pricedCount(saved.items ?? []));
  assert.equal(patch.quantities?.spaces.length, 2);
  assert.equal(patch.quantities?.specialLoads?.length, 2);
  assert.equal(patch.quantities?.overrides?.[0].point_type, "fans");
});

test("damaged or hostile snapshots fall back to the row's own columns", () => {
  assert.deepEqual(fromSnapshot(null), {});
  assert.deepEqual(fromSnapshot("nonsense"), {});
  assert.deepEqual(fromSnapshot([]), {});
  assert.deepEqual(fromSnapshot({ items: "not a list", quantities: {} }), {});

  const partial = fromSnapshot({
    name: "  ",
    kind: "invoice",
    totalGhs: "lots",
    items: [{ name: "Cable", quantity: "800", unit: 7, priceGhs: "6" }, { nope: true }],
  });
  assert.equal(partial.name, undefined, "blank names are ignored");
  assert.equal(partial.kind, undefined, "unknown kinds are ignored");
  assert.equal(partial.totalGhs, undefined, "text totals are ignored");
  assert.equal(partial.items?.length, 1, "only usable lines are kept");
  assert.equal(partial.items?.[0].quantity, 800);
  assert.equal(partial.items?.[0].priceGhs, null, "text prices are not trusted");
});
