import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRange, statusFromRange, buildManualResult } from "../src/shared/manualMcu.js";

test("parseRange: a-b, unicode dash, and open bounds", () => {
  assert.deepEqual(parseRange("13.0-17.5"), { min: 13, max: 17.5, minInclusive: true, maxInclusive: true });
  assert.deepEqual(parseRange("13 – 17.5"), { min: 13, max: 17.5, minInclusive: true, maxInclusive: true });
  assert.deepEqual(parseRange("<200"), { min: null, max: 200, maxInclusive: false });
  assert.deepEqual(parseRange("≤200"), { min: null, max: 200, maxInclusive: true });
  assert.deepEqual(parseRange(">40"), { min: 40, max: null, minInclusive: false });
  assert.equal(parseRange("negatif"), null);
  assert.equal(parseRange(""), null);
});

test("statusFromRange: only compares the entered number to the entered range", () => {
  assert.equal(statusFromRange("14.5", "13.0-17.5"), "ok");
  assert.equal(statusFromRange("12", "13.0-17.5"), "low");
  assert.equal(statusFromRange("18", "13.0-17.5"), "high");
  assert.equal(statusFromRange("245", "<200"), "high");
  assert.equal(statusFromRange("199", "<200"), "ok");
  assert.equal(statusFromRange("200", "<200"), "high", "strict < : 200 is not inside");
  assert.equal(statusFromRange("200", "<=200"), "ok", "inclusive <= : 200 is inside");
  assert.equal(statusFromRange("55", ">40"), "ok");
  assert.equal(statusFromRange("40", ">40"), "low", "strict > : 40 is not inside");
});

test("statusFromRange: unknown when the value or range can't be compared (never guessed)", () => {
  assert.equal(statusFromRange("Negatif", "<200"), "unknown");
  assert.equal(statusFromRange("14.5", ""), "unknown");
  assert.equal(statusFromRange("14.5", "rujukan dokter"), "unknown");
  assert.equal(statusFromRange("", ""), "unknown");
});

test("buildManualResult: analyze-mcu shape, no grade invented, range kept in the note", () => {
  const r = buildManualResult({
    patientName: "Budi",
    laboratory: "Prodia",
    rangeLabel: "Ref:",
    summary: "Data manual.",
    rows: [
      { label: "Hemoglobin", value: "14.5", unit: "g/dL", range: "13.0-17.5" },
      { label: "Kolesterol", value: "245", unit: "mg/dL", range: "<200" },
      { label: "Golongan Darah", value: "O", unit: "", range: "" },
      { label: "", value: "", unit: "", range: "" }, // empty row dropped
    ],
  });
  assert.equal(r.patient_name, "Budi");
  assert.equal(r.source, "manual");
  assert.ok(!("grade" in r) || r.grade === undefined, "no invented health grade");
  assert.equal(r.metrics.length, 3, "empty row dropped");
  assert.deepEqual(r.metrics[0], { label: "Hemoglobin", value: "14.5 g/dL", status: "ok", note: "Ref: 13.0-17.5" });
  assert.equal(r.metrics[1].status, "high");
  assert.equal(r.metrics[2].status, "unknown", "qualitative value with no range");
  assert.deepEqual(r.recommendations, []);
  assert.deepEqual(r.checklist, []);
});

test("buildManualResult: safe on empty / junk input", () => {
  assert.doesNotThrow(() => buildManualResult());
  assert.deepEqual(buildManualResult({ rows: null }).metrics, []);
});
