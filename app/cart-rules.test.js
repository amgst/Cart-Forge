import assert from "node:assert/strict";
import { test } from "node:test";
import { makeRule, validateRule } from "./cart-rules.js";

test("malformed submitted rules return an error instead of throwing", () => {
  for (const input of [null, [], 1, "rule", { template: "custom", name: 42 },
    { ...makeRule("custom", "USD"), message: {} }]) {
    assert.equal(typeof validateRule(input), "string");
  }
});

test("invalid thresholds cannot become zero or null when saved", () => {
  const rule = makeRule("minCartValue", "USD");
  for (const threshold of [null, true, [], "", "  ", Infinity, "1e309", NaN, -1]) {
    assert.equal(validateRule({ ...rule, threshold }), "Enter a valid number.");
  }
  for (const threshold of [0, 12.5, "12.5"]) {
    assert.equal(validateRule({ ...rule, threshold }), null);
  }
});

test("custom rules require a supported condition and comparison", () => {
  const rule = makeRule("custom", "USD");
  assert.equal(validateRule({ ...rule, condition: "unknown" }), "Choose a valid condition.");
  assert.equal(validateRule({ ...rule, comparison: "unknown" }), "Choose a valid comparison.");
  assert.equal(validateRule(rule), null);
});

test("quantity rules accept whole units while money rules accept decimals", () => {
  const rule = makeRule("totalCartQuantity", "USD");
  assert.equal(validateRule({ ...rule, threshold: 1.5 }), "Enter a whole number of units.");
  assert.equal(validateRule({ ...rule, threshold: 2 }), null);
  assert.equal(validateRule({ ...makeRule("custom", "USD"), threshold: 1.5 }), null);
});
