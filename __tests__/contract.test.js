import { test } from "node:test";
import assert from "node:assert/strict";
import { getSample } from "../src/shared/sampleData.js";
import { getStrings, getRenderLabels, LANGS } from "../src/shared/i18n.js";

// Matches the REAL my.20fit.id POST /api/analyze-mcu response shape
// (verified against the my20fit-dashboard source), not an aspirational spec.
const RESULT_KEYS = ["patient_name", "summary", "grade", "metrics", "recommendations", "checklist", "doctor_notes", "reviewed_at"];
const GRADES = new Set(["A", "B", "C", "D"]);
const STATUS = new Set(["ok", "high", "low", "warning"]);
const PRIORITY = new Set(["high", "med", "low"]);

test("sample data matches the real backend result shape in both languages", () => {
  for (const lang of LANGS) {
    const r = getSample(lang);
    for (const k of RESULT_KEYS) assert.ok(k in r, `${lang}: missing ${k}`);
    assert.ok(GRADES.has(r.grade), `${lang}: bad grade ${r.grade}`);
    assert.ok(Array.isArray(r.metrics) && r.metrics.length > 0, `${lang}: metrics`);
    for (const m of r.metrics) {
      for (const k of ["label", "value", "status"]) assert.ok(k in m, `${lang}: metric missing ${k}`);
      assert.ok(STATUS.has(m.status), `${lang}: bad status ${m.status}`);
    }
    assert.ok(Array.isArray(r.checklist) && r.checklist.length > 0, `${lang}: checklist`);
    for (const c of r.checklist) {
      for (const k of ["title", "reason", "priority"]) assert.ok(k in c, `${lang}: checklist item missing ${k}`);
      assert.ok(PRIORITY.has(c.priority), `${lang}: bad priority ${c.priority}`);
    }
    assert.ok(Array.isArray(r.recommendations) && r.recommendations.length > 0, `${lang}: recommendations`);
    assert.equal(typeof r.doctor_notes, "string");
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

test("the safety disclaimer is fixed copy in the render labels, not derived from the result", () => {
  for (const lang of LANGS) {
    const t = getRenderLabels(lang);
    assert.equal(typeof t.disclaimerText, "string");
    assert.ok(t.disclaimerText.length > 10, `${lang}: disclaimer text present`);
  }
});
