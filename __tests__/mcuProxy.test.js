import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createMcuProxyHandlers } from "../src/server/mcuProxy.js";

// Spin up a stand-in for my.20fit.id that records what the proxy forwarded, so
// the forwarding + gating can be exercised without any real network access.
async function withFakeUpstream(respond, run) {
  const seen = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      seen.push({ url: req.url, auth: req.headers["authorization"], body: JSON.parse(body || "{}") });
      respond(req, res);
    });
  });
  await new Promise((r) => server.listen(0, r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try { await run(origin, seen); } finally { await new Promise((r) => server.close(r)); }
}

// Mount one proxy handler on a throwaway server and POST to it, so the REAL
// req/res path (bearerToken, readJsonBody, sendJson) is exercised.
async function withProxy(handler, run) {
  const server = http.createServer((req, res) => handler(req, res));
  await new Promise((r) => server.listen(0, r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try { await run(origin); } finally { await new Promise((r) => server.close(r)); }
}

test("POST /api/mcu with NO Bearer token → 401 and NEVER calls upstream (spec §0.1 gate)", async () => {
  await withFakeUpstream(
    (req, res) => { res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"ok":true,"result":{}}'); },
    async (my20fitOrigin, seen) => {
      const { handleMcu } = createMcuProxyHandlers({ my20fitOrigin });
      await withProxy(handleMcu, async (proxy) => {
        const r = await fetch(`${proxy}/api/mcu`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: "data:image/jpeg;base64,AAAA", mime: "image/jpeg", lang: "id" }) });
        assert.equal(r.status, 401);
        const j = await r.json();
        assert.equal(j.error, "auth_required");
      });
      assert.equal(seen.length, 0, "upstream was never called for an anonymous request");
    },
  );
});

test("POST /api/mcu forwards {file,mime,lang} + the Bearer token, and relays the upstream result", async () => {
  await withFakeUpstream(
    (req, res) => { res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"ok":true,"result":{"document_type":"Lab","parameters":[{"label":"Hb","value":"14 g/dL","status":"normal"}]}}'); },
    async (my20fitOrigin, seen) => {
      const { handleMcu } = createMcuProxyHandlers({ my20fitOrigin });
      await withProxy(handleMcu, async (proxy) => {
        const r = await fetch(`${proxy}/api/mcu`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer TOKEN123" },
          body: JSON.stringify({ file: "data:image/jpeg;base64,AAAA", mime: "image/jpeg", lang: "en" }),
        });
        assert.equal(r.status, 200);
        const j = await r.json();
        assert.equal(j.result.document_type, "Lab");
      });
      assert.equal(seen.length, 1, "upstream called once");
      assert.equal(seen[0].url, "/api/mcu", "hits my.20fit's /api/mcu");
      assert.equal(seen[0].auth, "Bearer TOKEN123", "member token forwarded");
      assert.deepEqual(seen[0].body, { file: "data:image/jpeg;base64,AAAA", mime: "image/jpeg", lang: "en" }, "payload forwarded verbatim");
    },
  );
});

test("POST /api/mcu rejects a non-MCU upload: an empty extraction → 422 invalid_photo (keyless backstop, RULES.md §2)", async () => {
  // With no OPENROUTER_API_KEY in the test env, the vision guard is skipped (fail-open);
  // the empty-result net must still catch a document that yielded no parameters/findings.
  await withFakeUpstream(
    (req, res) => { res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"ok":true,"result":{"document_type":"Selfie","parameters":[],"abnormal_findings":[]}}'); },
    async (my20fitOrigin) => {
      const { handleMcu } = createMcuProxyHandlers({ my20fitOrigin });
      await withProxy(handleMcu, async (proxy) => {
        const r = await fetch(`${proxy}/api/mcu`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer X" }, body: JSON.stringify({ file: "data:image/jpeg;base64,AAAA", mime: "image/jpeg", lang: "id" }) });
        assert.equal(r.status, 422);
        const j = await r.json();
        assert.equal(j.error, "invalid_photo");
      });
    },
  );
});

test("POST /api/mcu relays an upstream error status/body (e.g. session expired)", async () => {
  await withFakeUpstream(
    (req, res) => { res.writeHead(401, { "Content-Type": "application/json" }); res.end('{"error":"Sesi kamu sudah habis.","session_expired":true}'); },
    async (my20fitOrigin) => {
      const { handleMcu } = createMcuProxyHandlers({ my20fitOrigin });
      await withProxy(handleMcu, async (proxy) => {
        const r = await fetch(`${proxy}/api/mcu`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer X" }, body: JSON.stringify({ file: "data:image/jpeg;base64,AAAA", mime: "image/jpeg" }) });
        assert.equal(r.status, 401);
        const j = await r.json();
        assert.equal(j.session_expired, true);
      });
    },
  );
});

test("POST /api/translate gates on token and forwards {lang,data}", async () => {
  await withFakeUpstream(
    (req, res) => { res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"ok":true,"result":{"summary":"translated"}}'); },
    async (my20fitOrigin, seen) => {
      const { handleTranslate } = createMcuProxyHandlers({ my20fitOrigin });
      await withProxy(handleTranslate, async (proxy) => {
        // No token → 401
        const r0 = await fetch(`${proxy}/api/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang: "en", data: { summary: "x" } }) });
        assert.equal(r0.status, 401);
        // With token → forwarded
        const r = await fetch(`${proxy}/api/translate`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer T" }, body: JSON.stringify({ lang: "en", data: { summary: "x" } }) });
        assert.equal(r.status, 200);
        assert.equal((await r.json()).result.summary, "translated");
      });
      assert.equal(seen.length, 1, "only the authed call reached upstream");
      assert.equal(seen[0].url, "/api/translate");
      assert.equal(seen[0].auth, "Bearer T");
    },
  );
});
