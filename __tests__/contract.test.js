import { test } from "node:test";
import assert from "node:assert/strict";
import { getSample } from "../src/shared/sampleData.js";
import { getStrings, getRenderLabels, LANGS } from "../src/shared/i18n.js";

const RESULT_KEYS = [
  "document_type",
  "patient_name",
  "date",
  "summary",
  "parameters",
  "abnormal_findings",
  "eating_plan",
  "exercise_plan",
  "lifestyle_plan",
  "unreadable",
  "disclaimer",
];
const STATUS = new Set(["normal", "attention", "unknown"]);
const DIRECTION = new Set(["high", "low", "normal", "unknown"]);
const SEVERITY = new Set(["ringan", "sedang", "tinggi"]);

test("sample data matches the spec §4 shape in both languages", () => {
  for (const lang of LANGS) {
    const r = getSample(lang);
    for (const k of RESULT_KEYS) assert.ok(k in r, `${lang}: missing ${k}`);
    assert.ok(Array.isArray(r.parameters) && r.parameters.length > 0, `${lang}: parameters`);
    for (const p of r.parameters) {
      for (const k of ["label", "value", "normal_range", "status", "direction", "explanation"]) {
        assert.ok(k in p, `${lang}: parameter missing ${k}`);
      }
      assert.ok(STATUS.has(p.status), `${lang}: bad status ${p.status}`);
      assert.ok(DIRECTION.has(p.direction), `${lang}: bad direction ${p.direction}`);
    }
    for (const a of r.abnormal_findings) {
      for (const k of ["label", "value", "severity", "why_it_matters", "what_to_do"]) {
        assert.ok(k in a, `${lang}: finding missing ${k}`);
      }
      assert.ok(SEVERITY.has(a.severity), `${lang}: bad severity ${a.severity}`);
    }
    assert.equal(typeof r.disclaimer, "string");
    assert.ok(r.disclaimer.length > 10, `${lang}: disclaimer present`);
  }
});

test("sample patient name is a clear placeholder (not a real-sounding person)", () => {
  const names = LANGS.map((l) => getSample(l).patient_name);
  for (const n of names) {
    assert.match(n, /contoh|sample/i, `placeholder-looking name expected, got: ${n}`);
  }
});

test("i18n strings + render labels have identical keys across languages", () => {
  const sId = getStrings("id");
  const sEn = getStrings("en");
  assert.deepEqual(Object.keys(sId).sort(), Object.keys(sEn).sort(), "string keys differ");
  assert.deepEqual(Object.keys(sId.nav).sort(), Object.keys(sEn.nav).sort(), "nav keys differ");

  const lId = getRenderLabels("id");
  const lEn = getRenderLabels("en");
  assert.deepEqual(Object.keys(lId).sort(), Object.keys(lEn).sort(), "label keys differ");
});
