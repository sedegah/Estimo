import assert from "node:assert/strict";
import test from "node:test";

// The catalogue price reader must degrade quietly when the API is unreachable.
test("catalogue prices fall back to an empty map when the API fails", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("network down");
  };
  try {
    const { getLivePrices } = await import("../lib/api/catalogue-prices.ts");
    const prices = await getLivePrices();
    assert.deepEqual(prices, {});
  } finally {
    globalThis.fetch = original;
  }
});

test("catalogue prices keep only numeric values", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ items: [{ id: "a", price_ghs: 12.5 }, { id: "b", price_ghs: null }, { id: "c" }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  try {
    const { getLivePrices } = await import("../lib/api/catalogue-prices.ts");
    const prices = await getLivePrices();
    assert.deepEqual(prices, { a: 12.5 });
  } finally {
    globalThis.fetch = original;
  }
});
