/**
 * Saved projects are ordered by the last save, not by the first one: saving an old project
 * again must bring it to the top of the list.
 */
import assert from "node:assert/strict";
import test from "node:test";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
}

function installWindow() {
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: new MemoryStorage(),
    dispatchEvent: () => true,
  };
  (globalThis as unknown as { Event: unknown }).Event = class {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  };
}

const recent = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const entry = (name: string) => ({
  name,
  kind: "quick" as const,
  detail: `${name} detail`,
  totalGhs: 1000,
});

test("the newest save comes first, including a project saved again", async () => {
  installWindow();
  const { saveEstimate, listSavedEstimates, updateSavedEstimate } = await import(
    "../lib/storage/saved-estimates.ts"
  );

  const first = saveEstimate(entry("First home"));
  await new Promise((resolve) => setTimeout(resolve, 5));
  const second = saveEstimate(entry("Second home"));

  assert.deepEqual(
    listSavedEstimates().map((saved) => saved.name),
    ["Second home", "First home"],
    "a new save goes on top",
  );
  assert.ok(first.updatedAt, "a saved project records when it was saved");
  assert.deepEqual(first.createdAt, first.updatedAt, "first save: created and updated are the same");

  await new Promise((resolve) => setTimeout(resolve, 5));
  updateSavedEstimate(first.id, { totalGhs: 1200 });

  const ordered = listSavedEstimates();
  assert.deepEqual(ordered.map((saved) => saved.name), ["First home", "Second home"], "saving again moves it up");
  assert.equal(ordered[0].totalGhs, 1200);
  assert.equal(ordered[0].createdAt, first.createdAt, "the original date is kept");
  assert.notEqual(ordered[0].updatedAt, first.updatedAt, "the save date moves");
  assert.equal(second.id !== first.id, true);
});

test("projects saved before this rule still list by their creation date", async () => {
  installWindow();
  const { listSavedEstimates } = await import("../lib/storage/saved-estimates.ts");
  const legacy = [
    { id: "old-1", name: "Older", kind: "quick", createdAt: recent(3), detail: "", totalGhs: 1 },
    { id: "old-2", name: "Newer", kind: "quick", createdAt: recent(2), detail: "", totalGhs: 1 },
  ];
  (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.setItem(
    "estimo_saved_estimates_v1",
    JSON.stringify(legacy),
  );

  assert.deepEqual(listSavedEstimates().map((saved) => saved.name), ["Newer", "Older"]);
});

test("every estimate carries a readable code, including the ones saved before codes", async () => {
  installWindow();
  const { saveEstimate, listSavedEstimates } = await import("../lib/storage/saved-estimates.ts");
  const storage = (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage;

  // two estimates saved before codes existed
  storage.setItem(
    "estimo_saved_estimates_v1",
    JSON.stringify([
      { id: "old-1", name: "Old one", kind: "quick", createdAt: recent(3), detail: "", totalGhs: 1 },
      { id: "old-2", name: "Old two", kind: "quick", createdAt: recent(2), detail: "", totalGhs: 2 },
    ]),
  );

  const backfilled = listSavedEstimates();
  assert.equal(backfilled.length, 2);
  for (const entry of backfilled) {
    assert.match(entry.code ?? "", /^EST-[A-HJ-NP-Z2-9]{6}$/, "a code with no I, O, 0 or 1");
  }
  assert.notEqual(backfilled[0].code, backfilled[1].code, "codes are unique");

  // the backfill is written back, so the code a person reads out stays the same
  const persisted = JSON.parse(storage.getItem("estimo_saved_estimates_v1") ?? "[]");
  assert.equal(persisted[0].code, backfilled.find((entry) => entry.id === persisted[0].id)?.code);
  const again = listSavedEstimates();
  assert.deepEqual(again.map((entry) => entry.code), backfilled.map((entry) => entry.code));

  const fresh = saveEstimate({ name: "New", kind: "quick", detail: "", totalGhs: 3 });
  assert.match(fresh.code ?? "", /^EST-[A-HJ-NP-Z2-9]{6}$/);
  assert.ok(!again.some((entry) => entry.code === fresh.code), "a new estimate gets a new code");
});

test("an estimate unused for 40 days is cleared; using it keeps it", async () => {
  installWindow();
  const { listSavedEstimates, touchSavedEstimate, purgeExpiredEstimates, RETENTION_DAYS } = await import(
    "../lib/storage/saved-estimates.ts"
  );
  const storage = (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage;
  assert.equal(RETENTION_DAYS, 40);

  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  storage.setItem(
    "estimo_saved_estimates_v1",
    JSON.stringify([
      { id: "stale", name: "Stale", kind: "quick", createdAt: daysAgo(60), updatedAt: daysAgo(60), lastAccessedAt: daysAgo(41), detail: "", totalGhs: 1 },
      { id: "live", name: "Live", kind: "quick", createdAt: daysAgo(60), updatedAt: daysAgo(60), lastAccessedAt: daysAgo(39), detail: "", totalGhs: 2 },
      { id: "opened", name: "Opened today", kind: "quick", createdAt: daysAgo(60), updatedAt: daysAgo(60), lastAccessedAt: daysAgo(41), detail: "", totalGhs: 3 },
    ]),
  );

  // opening one now keeps it
  touchSavedEstimate("opened");

  const purged = purgeExpiredEstimates();
  assert.deepEqual(purged, ["stale"], "only the one untouched for 40 days goes");

  const remaining = listSavedEstimates();
  assert.deepEqual(remaining.map((entry) => entry.name).sort(), ["Live", "Opened today"]);
  const persisted = JSON.parse(storage.getItem("estimo_saved_estimates_v1") ?? "[]");
  assert.deepEqual(persisted.map((entry: { name: string }) => entry.name).sort(), ["Live", "Opened today"]);

  // and it does not come back from an old local copy
  assert.deepEqual(listSavedEstimates().map((entry) => entry.name).sort(), ["Live", "Opened today"]);
});

test("guest estimates are hidden from an account, then adopted on sign-in", async () => {
  installWindow();
  const { saveEstimate, listSavedEstimates, adoptGuestEstimates } = await import(
    "../lib/storage/saved-estimates.ts"
  );
  const { writeOwner } = await import("../lib/storage/reset.ts");

  writeOwner("");
  const guest = saveEstimate({ name: "Guest estimate", kind: "quick", detail: "", totalGhs: 1 });
  assert.equal(listSavedEstimates().length, 1, "the guest sees their own work");

  writeOwner("user_A");
  assert.deepEqual(listSavedEstimates(), [], "an account never sees guest work as its own");

  const moved = adoptGuestEstimates("user_A");
  assert.deepEqual(moved.map((entry) => entry.id), [guest.id]);
  assert.deepEqual(listSavedEstimates().map((entry) => entry.name), ["Guest estimate"]);

  writeOwner("");
  assert.deepEqual(listSavedEstimates(), [], "account work is hidden from a signed-out visitor");

  writeOwner("user_A");
  assert.deepEqual(listSavedEstimates().map((entry) => entry.name), ["Guest estimate"], "and returns on sign-in");
});
