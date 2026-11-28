/**
 * Washrooms are a building rule, not a preference: offices, shops and workshops must
 * provide at least two. The counters enforce it in the UI; the templates must already
 * satisfy it so the itemized bill and the simple summary agree.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { clampCount, defaultCounts, minimumCount } from "../lib/estimate-model.ts";

const DATA = path.join(import.meta.dirname, "..", "lib", "data", "quantity-engine");
const read = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(DATA, file), "utf8")) as T;

type Template = { template_id: string; project_type: string; template_name: string };
type Space = { template_id: string; room_type: string; quantity: number };

const templates = read<Template[]>("structure_templates.json");
const spaces = read<Space[]>("template_spaces.json");

const REQUIRED: Record<string, string> = {
  office: "COMM-OFF-S",
  shop_retail: "SHOP-RETAIL",
  workshop_small_factory: "IND-WORK",
};

test("every office, shop and workshop template has two washrooms or more", () => {
  for (const [projectType, code] of Object.entries(REQUIRED)) {
    const rows = templates.filter((template) => template.project_type === projectType);
    assert.ok(rows.length > 0, `${projectType} should have templates`);
    for (const template of rows) {
      const washrooms = spaces
        .filter(
          (space) =>
            space.template_id === template.template_id &&
            (space.room_type === "wc" || space.room_type === "bathroom"),
        )
        .reduce((sum, space) => sum + (space.quantity || 1), 0);
      assert.ok(
        washrooms >= 2,
        `${template.template_id} (${template.template_name}, ${code}) has ${washrooms} washroom(s)`,
      );
    }
  }
});

test("the counters start at two washrooms and can be deselected to zero", () => {
  for (const code of Object.values(REQUIRED)) {
    assert.equal(minimumCount(code, "washroom"), 0, `${code} minimum`);
    assert.ok((defaultCounts(code).washroom ?? 0) >= 2, `${code} default`);
    assert.equal(clampCount(code, "washroom", 0), 0, `${code} allows zero`);
    assert.equal(clampCount(code, "washroom", -1), 0, `${code} clamps negative to zero`);
    assert.equal(clampCount(code, "washroom", 5), 5, `${code} keeps a larger count`);
  }
});

test("homes and kiosks keep their own washroom counts", () => {
  assert.equal(minimumCount("HOME-2B", "washroom"), 0);
  assert.equal(minimumCount("SHOP-KIOSK", "washroom"), 0);
  assert.equal(clampCount("HOME-2B", "bedrooms", -3), 0);
  assert.equal(clampCount("HOME-2B", "bedrooms", 99), 20);
});
