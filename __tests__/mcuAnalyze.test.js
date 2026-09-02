import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { callAnalyzeMcu } from "../src/server/mcuAnalyze.js";

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
