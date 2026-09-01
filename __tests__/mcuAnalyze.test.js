import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveTeaser } from "../src/server/mcuAnalyze.js";
import { getSample } from "../src/shared/sampleData.js";

test("deriveTeaser never leaks per-parameter values, statuses, or notes", () => {
  const sample = getSample("id");
  const teaser = deriveTeaser(sample, "id");
  const json = JSON.stringify(teaser);
  for (const m of sample.metrics) {
    assert.ok(!json.includes(m.value), `teaser leaked a value: ${m.value}`);
    if (m.note) assert.ok(!json.includes(m.note), `teaser leaked a note: ${m.note}`);
  }
  assert.ok(!json.includes(sample.summary), "teaser leaked the summary");
  assert.ok(!json.includes(sample.doctor_notes), "teaser leaked doctor_notes");
  assert.equal(Object.keys(teaser).sort().join(","), "categories,parameters_detected,scanned_at");
});

test("deriveTeaser reports an accurate parameter count and category set", () => {
  const result = {
    metrics: [
      { label: "Kolesterol Total", value: "228 mg/dL", status: "high" },
      { label: "HDL", value: "52 mg/dL", status: "ok" },
      { label: "Gula Darah Puasa", value: "108 mg/dL", status: "warning" },
      { label: "Tekanan Darah", value: "118/78", status: "ok" },
    ],
  };
  const teaser = deriveTeaser(result, "id");
  assert.equal(teaser.parameters_detected, 4);
  assert.deepEqual(new Set(teaser.categories), new Set(["Profil Lipid", "Gula Darah", "Tekanan Darah"]));
  assert.equal(typeof teaser.scanned_at, "string");
});

test("deriveTeaser falls back to a generic category for unrecognized labels", () => {
  const teaser = deriveTeaser({ metrics: [{ label: "Zat Misterius X", value: "1", status: "ok" }] }, "id");
  assert.deepEqual(teaser.categories, ["Penanda Lain"]);
});

test("deriveTeaser handles missing/empty metrics without throwing", () => {
  assert.doesNotThrow(() => deriveTeaser({}, "id"));
  assert.doesNotThrow(() => deriveTeaser(null, "id"));
  const teaser = deriveTeaser({ metrics: [] }, "id");
  assert.equal(teaser.parameters_detected, 0);
  assert.deepEqual(teaser.categories, []);
});
