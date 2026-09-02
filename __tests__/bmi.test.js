import { test } from "node:test";
import assert from "node:assert/strict";
import { bmiValue, bmiCategory, whtrValue, whtrFlag, round1 } from "../src/shared/bmi.js";

test("bmiValue computes weight/height² and rejects bad input", () => {
  assert.equal(round1(bmiValue(170, 65)), "22.5"); // 65 / 1.7²
  assert.equal(round1(bmiValue(180, 90)), "27.8");
  assert.equal(bmiValue(0, 65), null);
  assert.equal(bmiValue(170, 0), null);
  assert.equal(bmiValue("abc", 65), null);
  assert.equal(bmiValue(-170, 65), null);
});

test("bmiCategory uses standard WHO international thresholds", () => {
  assert.equal(bmiCategory(17), "under");
  assert.equal(bmiCategory(18.5), "normal");
  assert.equal(bmiCategory(24.9), "normal");
  assert.equal(bmiCategory(25), "over");
  assert.equal(bmiCategory(29.9), "over");
  assert.equal(bmiCategory(30), "obese");
  assert.equal(bmiCategory(null), null);
});

test("bmiCategory supports WHO Asia-Pacific cut-offs", () => {
  assert.equal(bmiCategory(22.9, { asia: true }), "normal");
  assert.equal(bmiCategory(23, { asia: true }), "over");
  assert.equal(bmiCategory(25, { asia: true }), "obese");
  // The same BMI lands differently between the two official sets:
  assert.equal(bmiCategory(24, {}), "normal");
  assert.equal(bmiCategory(24, { asia: true }), "over");
});

test("whtr uses the standard 0.5 rule", () => {
  assert.equal(whtrFlag(whtrValue(80, 170)), "ok"); // 0.47
  assert.equal(whtrFlag(whtrValue(90, 170)), "high"); // 0.53
  assert.equal(whtrFlag(0.5), "high"); // exactly 0.5 is not below → high
  assert.equal(whtrValue(0, 170), null);
  assert.equal(whtrFlag(null), null);
});

test("round1 formats one decimal, empty for invalid", () => {
  assert.equal(round1(22.49), "22.5");
  assert.equal(round1(null), "");
  assert.equal(round1(NaN), "");
});
