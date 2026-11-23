/**
 * The console's estimate registry exports a CSV; support needs it to open cleanly in
 * a spreadsheet, so quoting and column order are covered here.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { estimatesToCsv, money, shortDate, type AdminEstimate } from "../admin/lib/estimate-admin.ts";

const row = (overrides: Partial<AdminEstimate> = {}): AdminEstimate => ({
  id: "est-1",
  name: "2-Bedroom Standard estimate",
  template: "HOME-2B",
  quality: "standard",
  specLevel: "standard",
  ruleSet: "ESTIMO-GH-QTY-v1.0",
  totalGhs: 18714.7,
  computedTotalGhs: 18714.7,
  lines: 17,
  pricedLines: 17,
  pendingLines: 0,
  spaces: 9,
  specialLoads: 1,
  owner: "user_2abc",
  status: "estimated",
  createdAt: "2026-11-23 18:00:00",
  updatedAt: "2026-11-23 18:00:00",
  ...overrides,
});

test("the CSV opens with the columns a support person needs", () => {
  const csv = estimatesToCsv([row()]);
  const [header, first] = csv.split("\n");
  assert.equal(
    header,
    "Created,Name,Template,Specification,Rule set,Spaces,Lines,Priced,Pending,Special loads,Total GHS,Status,Owner",
  );
  assert.equal(
    first,
    "23 Nov 2026,2-Bedroom Standard estimate,HOME-2B,standard,ESTIMO-GH-QTY-v1.0,9,17,17,0,1,18714.70,estimated,user_2abc",
  );
});

test("commas, quotes and newlines in a name do not break the file", () => {
  const csv = estimatesToCsv([row({ name: 'Shop, "Main" counter' })]);
  const first = csv.split("\n")[1];
  assert.ok(first.includes('"Shop, ""Main"" counter"'), "the name is quoted and its quotes doubled");
});

test("a missing total leaves the cell empty rather than printing a fake zero", () => {
  const csv = estimatesToCsv([row({ totalGhs: null })]);
  assert.ok(csv.split("\n")[1].includes(",estimated,"), "total cell is empty");
});

test("money and dates read the way the console shows them", () => {
  assert.equal(money(18714.7), "GHS 18,714.70");
  assert.equal(money(null), "—");
  assert.equal(shortDate("2026-11-23 18:00:00"), "23 Nov 2026");
});
