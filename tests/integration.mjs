// Integration checks against the running website and the deployed data API.
// Run with `npm run test:integration` while the site is up, or set ESTIMO_BASE_URL.
import assert from "node:assert/strict";

const site = process.env.ESTIMO_BASE_URL || "http://localhost:3000";
const api = process.env.ESTIMO_API_URL || "https://estimo-api.sedegahkimathi.workers.dev";

const results = [];

async function check(name, run) {
  try {
    await run();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
    console.log(`FAIL  ${name}: ${error}`);
  }
}

await check("API health responds", async () => {
  const response = await fetch(`${api}/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
});

await check("public catalogue exposes all seeded materials", async () => {
  const response = await fetch(`${api}/catalogue`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Array.isArray(body.items));
  assert.ok(body.items.length >= 122, `expected at least 122 items, got ${body.items.length}`);
});

await check("estimates require a session", async () => {
  const response = await fetch(`${api}/estimates`);
  assert.equal(response.status, 401);
});

await check("an invalid token is rejected", async () => {
  const response = await fetch(`${api}/estimates`, { headers: { Authorization: "Bearer not-a-token" } });
  assert.equal(response.status, 401);
});

await check("price writes require an admin session", async () => {
  const response = await fetch(`${api}/admin/catalogue/prices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId: "test", priceGhs: 1 }),
  });
  assert.equal(response.status, 401);
});

await check("template writes require an admin session", async () => {
  const response = await fetch(`${api}/admin/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "test", plan: [] }),
  });
  assert.equal(response.status, 401);
});

await check("website catalogue lists the full catalogue with pagination", async () => {
  const response = await fetch(`${site}/catalogue`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes("of 122"), "expected 122 materials to be reported");
  assert.ok(html.includes('class="pager"'), "expected pagination controls");
  assert.ok(html.includes("Previous") && html.includes("Next"));
});

await check("estimate PDF is a real PDF", async () => {
  const response = await fetch(
    `${site}/api/estimates/pdf?template=HOME-2B&quality=standard&bedrooms=2&bathrooms=1&kitchens=1&living=1&porches=0`,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.ok(bytes.length > 10000, "PDF should carry the embedded typeface");
  assert.equal(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]), "%PDF");
});

const failed = results.filter((entry) => !entry.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exit(1);
