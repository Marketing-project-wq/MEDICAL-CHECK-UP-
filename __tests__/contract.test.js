import { test } from "node:test";
import assert from "node:assert/strict";
import { getStrings, getRenderLabels, LANGS } from "../src/shared/i18n.js";

test("i18n strings + render labels have identical keys across languages", () => {
  const sId = getStrings("id");
  const sEn = getStrings("en");
  assert.deepEqual(Object.keys(sId).sort(), Object.keys(sEn).sort(), "string keys differ");
  assert.deepEqual(Object.keys(sId.nav).sort(), Object.keys(sEn.nav).sort(), "nav keys differ");

  const lId = getRenderLabels("id");
  const lEn = getRenderLabels("en");
  assert.deepEqual(Object.keys(lId).sort(), Object.keys(lEn).sort(), "label keys differ");
});

test("the safety disclaimer is fixed copy in the render labels, not derived from the result", () => {
  for (const lang of LANGS) {
    const t = getRenderLabels(lang);
    assert.equal(typeof t.disclaimerText, "string");
    assert.ok(t.disclaimerText.length > 10, `${lang}: disclaimer text present`);
  }
});
