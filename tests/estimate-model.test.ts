import assert from "node:assert/strict";
import test from "node:test";
import { computeEstimate, defaultCounts, estimateLines, projectType, totalSpaces } from "../lib/estimate-model.ts";

test("the two-bedroom anchor matches the calibrated total", () => {
  const total = computeEstimate("HOME-2B", defaultCounts("HOME-2B"), "standard");
  assert.equal(total, 16800);
});

test("premium fittings cost more than basic ones", () => {
  const counts = defaultCounts("HOME-3B");
  const basic = computeEstimate("HOME-3B", counts, "basic");
  const standard = computeEstimate("HOME-3B", counts, "standard");
  const premium = computeEstimate("HOME-3B", counts, "premium");
  assert.ok(basic < standard, "standard should exceed basic");
  assert.ok(standard < premium, "premium should exceed standard");
});

test("adding a room increases the total", () => {
  const counts = defaultCounts("HOME-2B");
  const before = computeEstimate("HOME-2B", counts, "standard");
  const after = computeEstimate("HOME-2B", { ...counts, bedrooms: (counts.bedrooms ?? 0) + 1 }, "standard");
  assert.ok(after > before);
});

test("every project type produces a positive total and lines that add up", () => {  for (const code of ["HOME-1R", "HOME-1B", "HOME-2B", "HOME-3B", "HOME-4B", "SHOP-KIOSK", "SHOP-RETAIL", "COMM-OFF-S", "IND-WORK"]) {
    const type = projectType(code);
    const counts = defaultCounts(code);
    const total = computeEstimate(code, counts, "standard");
    assert.ok(total > 0, `${code} total should be positive`);
    const lines = estimateLines(total, code, counts);
    assert.ok(lines.length > 0, `${code} should produce lines`);
    const sum = lines.reduce((carry, line) => carry + line.amount, 0);
    assert.ok(Math.abs(sum - total) / total < 0.02, `${code} lines should sum to the total`);
    assert.ok(totalSpaces(counts) > 0, `${code} should count spaces`);
    assert.ok(type.label.length > 0);
  }
});
