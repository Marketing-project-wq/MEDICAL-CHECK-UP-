import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { deriveTeaser, callAnalyzeMcu } from "../src/server/mcuAnalyze.js";

// Spins up a local stand-in for my.20fit.id that responds however the test
// wants, so callAnalyzeMcu's response-handling can be exercised without any
// real network access (this sandbox has none to the real my.20fit.id).
async function withFakeUpstream(respond, run) {
  const server = http.createServer((req, res) => respond(req, res));
  await new Promise((resolve) => server.listen(0, resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(origin);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const TINY_DATA_URL = "data:image/jpeg;base64,/9j/2wA=";

test("callAnalyzeMcu maps the real backend's not_mcu validation error to a distinct code", async () => {
  await withFakeUpstream(
    (req, res) => {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "not_mcu", document_type: "KTP", message: "Dokumen ini bukan hasil MCU." }));
    },
    async (my20fitOrigin) => {
      const outcome = await callAnalyzeMcu({ my20fitOrigin, dataUrl: TINY_DATA_URL, mime: "image/jpeg" });
      assert.equal(outcome.ok, false);
      assert.equal(outcome.status, 400);
      assert.equal(outcome.code, "not_mcu");
    },
  );
});

test("callAnalyzeMcu maps the real backend's incomplete_mcu validation error to a distinct code", async () => {
  await withFakeUpstream(
    (req, res) => {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "incomplete_mcu", missing: ["patient name", "exam date"] }));
    },
    async (my20fitOrigin) => {
      const outcome = await callAnalyzeMcu({ my20fitOrigin, dataUrl: TINY_DATA_URL, mime: "image/jpeg" });
      assert.equal(outcome.ok, false);
      assert.equal(outcome.code, "incomplete_mcu");
    },
  );
});

test("callAnalyzeMcu falls back to analyze_failed for any other upstream error shape", async () => {
  await withFakeUpstream(
    (req, res) => {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "AI analysis failed to return a result" }));
    },
    async (my20fitOrigin) => {
      const outcome = await callAnalyzeMcu({ my20fitOrigin, dataUrl: TINY_DATA_URL, mime: "image/jpeg" });
      assert.equal(outcome.ok, false);
      assert.equal(outcome.code, "analyze_failed");
    },
  );
});

test("callAnalyzeMcu returns the real result on success, unchanged", async () => {
  const fakeResult = { summary: "ok", grade: "A", metrics: [], recommendations: [], checklist: [], doctor_notes: "", reviewed_at: "2026-09-02" };
  await withFakeUpstream(
    (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(fakeResult));
    },
    async (my20fitOrigin) => {
      const outcome = await callAnalyzeMcu({ my20fitOrigin, dataUrl: TINY_DATA_URL, mime: "image/jpeg" });
      assert.equal(outcome.ok, true);
      assert.deepEqual(outcome.result, fakeResult);
    },
  );
});

// Fixture matching the real my.20fit.id POST /api/analyze-mcu response shape.
const sample = {
  summary: "Ringkasan hasil keseluruhan.",
  doctor_notes: "Tidak ada perhatian mendesak.",
  metrics: [
    { label: "Kolesterol Total", value: "228 mg/dL", status: "high", note: "Di atas rentang rujukan." },
    { label: "HDL", value: "52 mg/dL", status: "ok", note: "Dalam rentang normal." },
  ],
};

test("deriveTeaser never leaks per-parameter values, statuses, or notes", () => {
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
