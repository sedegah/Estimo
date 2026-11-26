import assert from "node:assert/strict";
import test from "node:test";

// Minimal browser stand-ins so the storage lifecycle can be exercised in Node.
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.has(key) ? this.data.get(key)! : null; }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
}

function installWindow() {
  const storage = new MemoryStorage();
  const events: string[] = [];
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: storage,
    dispatchEvent: (event: Event) => {
      events.push(event.type);
      return true;
    },
  };
  (globalThis as unknown as { Event: unknown }).Event = class {
    type: string;
    constructor(type: string) { this.type = type; }
  };
  return { storage, events };
}

test("a different account clears session data but keeps the saved estimates", async () => {
  const { storage } = installWindow();
  const { reconcileOwner, readOwner } = await import("../lib/storage/reset.ts");

  storage.setItem("estimo_saved_estimates_v1", "[]");
  reconcileOwner("user_A");
  assert.equal(readOwner(), "user_A");

  storage.setItem("estimo_saved_estimates_v1", "[\"estimate\"]");
  storage.setItem("estimo_draft_v1", "{\"draft\":true}");
  const cleared = reconcileOwner("user_B");
  assert.equal(cleared, true);
  assert.equal(storage.getItem("estimo_draft_v1"), null, "the session draft goes");
  assert.equal(storage.getItem("estimo_saved_estimates_v1"), "[\"estimate\"]", "the estimate stays, ready to be adopted");
  assert.equal(readOwner(), "user_B");
});

test("signing out keeps the saved estimates", async () => {
  const { storage } = installWindow();
  const { reconcileOwner, readOwner } = await import("../lib/storage/reset.ts");

  reconcileOwner("user_A");
  storage.setItem("estimo_guest_estimate_v1", "[]");
  storage.setItem("estimo_saved_estimates_v1", "[\"kept\"]");
  const cleared = reconcileOwner("");
  assert.equal(cleared, true);
  assert.equal(storage.getItem("estimo_guest_estimate_v1"), null, "session state goes");
  assert.equal(storage.getItem("estimo_saved_estimates_v1"), "[\"kept\"]", "signing out must not destroy estimates");
  assert.equal(readOwner(), "");
});

test("the first sign-in keeps the guest work on the device", async () => {
  const { storage } = installWindow();
  const { reconcileOwner } = await import("../lib/storage/reset.ts");

  storage.setItem("estimo_saved_estimates_v1", "[\"guest\"]");
  const cleared = reconcileOwner("user_A");
  assert.equal(cleared, false);
  assert.equal(storage.getItem("estimo_saved_estimates_v1"), "[\"guest\"]");
});
