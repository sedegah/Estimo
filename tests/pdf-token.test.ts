/**
 * Guest PDF downloads use a signed link: the payload is inside the token, it expires,
 * and any edit invalidates it. These tests guard that contract.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { PDF_LINK_TTL_SECONDS, signPdfToken, verifyPdfToken } from "../lib/pdf/token.ts";

const payload = {
  template: "HOME-2B",
  quality: "standard" as const,
  name: "2-Bedroom Home estimate",
  counts: { living: 1, bedrooms: 2, kitchen: 1 },
  loads: ["refrigerator"],
};

test("a signed link round-trips its estimate", () => {
  const token = signPdfToken(payload);
  const decoded = verifyPdfToken(token);
  assert.ok(decoded);
  assert.equal(decoded.template, "HOME-2B");
  assert.equal(decoded.quality, "standard");
  assert.deepEqual(decoded.counts, payload.counts);
  assert.deepEqual(decoded.loads, ["refrigerator"]);
  assert.ok(decoded.exp > Math.floor(Date.now() / 1000), "the link has time left");
  assert.ok(decoded.exp <= Math.floor(Date.now() / 1000) + PDF_LINK_TTL_SECONDS + 2);
});

test("an edited payload no longer verifies", () => {
  const token = signPdfToken(payload);
  const [body, signature] = token.split(".");
  const tampered = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  tampered.counts.bedrooms = 60;
  const forgedBody = Buffer.from(JSON.stringify(tampered), "utf8").toString("base64url");

  assert.equal(verifyPdfToken(`${forgedBody}.${signature}`), null, "payload changes are rejected");
  assert.equal(verifyPdfToken(`${body}.${signature.slice(0, -2)}AA`), null, "signature changes are rejected");
});

test("expired and malformed links are refused", () => {
  const expired = signPdfToken(payload, -10);
  assert.equal(verifyPdfToken(expired), null);

  assert.equal(verifyPdfToken(null), null);
  assert.equal(verifyPdfToken(""), null);
  assert.equal(verifyPdfToken("not-a-token"), null);
  assert.equal(verifyPdfToken("a.b"), null, "garbage does not pass the signature check");
});
