
import assert from "node:assert/strict";
import test from "node:test";

import {
  convertFromGhs,
  formatMoney,
  getDisplayCurrency,
  isCurrency,
  setDisplayCurrency,
  setExchangeRates,
} from "../lib/currency.ts";

test("cedis are the base and the default display currency", () => {
  setDisplayCurrency("GHS");
  assert.equal(getDisplayCurrency(), "GHS");
  assert.equal(convertFromGhs(100), 100);
  assert.match(formatMoney(19922, 0), /19922|19,922/);
});

test("dollars, pounds and euros convert from the cedi amount", () => {
  setExchangeRates({ GHS: 1, USD: 0.084, GBP: 0.064, EUR: 0.077 });

  setDisplayCurrency("USD");
  assert.ok(Math.abs(convertFromGhs(1000) - 84) < 1e-9);
  assert.match(formatMoney(1000, 2), /84\.00/);

  setDisplayCurrency("GBP");
  assert.ok(Math.abs(convertFromGhs(1000) - 64) < 1e-9);
  assert.match(formatMoney(1000, 2), /64\.00/);

  setDisplayCurrency("EUR");
  assert.ok(Math.abs(convertFromGhs(1000) - 77) < 1e-9);
  assert.match(formatMoney(1000, 2), /77\.00/);

  setDisplayCurrency("GHS");
});

test("only the four supported currencies are accepted", () => {
  assert.equal(isCurrency("USD"), true);
  assert.equal(isCurrency("CAD"), false);
  assert.equal(isCurrency(undefined), false);
});
