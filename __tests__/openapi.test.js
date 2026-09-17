import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderApiDocsPage } from "../src/views/docsPage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OPENAPI_DIR = path.join(__dirname, "..", "src", "openapi");
const jsonText = readFileSync(path.join(OPENAPI_DIR, "openapi.json"), "utf8");
const yamlText = readFileSync(path.join(OPENAPI_DIR, "openapi.yaml"), "utf8");
const spec = JSON.parse(jsonText);

// This app has exactly 4 JSON API endpoints — everything else is server-rendered
// HTML. The spec must document exactly these, nothing more (no accidental
// exposure of an internal-only route) and nothing less.
const EXPECTED_PATHS = ["/api/scan", "/api/quiz/submit", "/api/quiz/history", "/api/public/articles"];

test("openapi.json documents exactly the app's 4 real JSON API endpoints", () => {
  assert.deepEqual(Object.keys(spec.paths).sort(), [...EXPECTED_PATHS].sort());
});

test("openapi.json declares bearer-JWT auth and requires it on the sensitive endpoints", () => {
  const scheme = spec.components.securitySchemes.supabaseBearerAuth;
  assert.equal(scheme.type, "http");
  assert.equal(scheme.scheme, "bearer");
  assert.equal(scheme.bearerFormat, "JWT");

  assert.deepEqual(spec.paths["/api/scan"].post.security, [{ supabaseBearerAuth: [] }]);
  assert.deepEqual(spec.paths["/api/quiz/history"].get.security, [{ supabaseBearerAuth: [] }]);
  // Quiz submission is intentionally answerable anonymously — auth is optional,
  // and also accepts a partner API key (see the dedicated test below).
  assert.deepEqual(spec.paths["/api/quiz/submit"].post.security, [{ supabaseBearerAuth: [] }, { partnerApiKeyAuth: [] }, {}]);
  // Article listing is public content — no auth at all, by design. It's
  // deliberately NOT at /api/articles (main's authenticated publish/manage
  // CRUD API, out of scope for this spec) — see the path test above.
  assert.deepEqual(spec.paths["/api/public/articles"].get.security, []);
});

test("openapi.json's public article feed is never at the same path as the authenticated publish API", () => {
  assert.equal(spec.paths["/api/articles"], undefined, "the publish/management API is a separate, deliberately undocumented-here surface");
});

test("openapi.json declares the partner API key scheme and scopes it to /api/quiz/submit only", () => {
  const scheme = spec.components.securitySchemes.partnerApiKeyAuth;
  assert.equal(scheme.type, "apiKey");
  assert.equal(scheme.in, "header");
  assert.equal(scheme.name, "X-API-Key");

  const securedPaths = Object.entries(spec.paths).filter(([, methods]) =>
    Object.values(methods).some((op) => (op.security || []).some((req) => "partnerApiKeyAuth" in req)),
  );
  assert.deepEqual(securedPaths.map(([p]) => p), ["/api/quiz/submit"]);
});

test("openapi.json never publishes the full /api/scan result schema (patient-identifying/clinical data)", () => {
  const schema = spec.components.schemas.ScanSuccessResponse.properties.result;
  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, true, "result stays an opaque object — no field-level schema");
  assert.doesNotMatch(JSON.stringify(spec.paths["/api/scan"]), /patient_name|doctor_notes/);
});

test("openapi.json contains no hardcoded secrets/credentials — only placeholders", () => {
  assert.doesNotMatch(jsonText, /eyJ[a-zA-Z0-9_-]{20,}/, "no JWT-looking token embedded");
  assert.match(jsonText, /PLACEHOLDER/);
});

test("openapi.yaml stays in sync with openapi.json (same operationIds and paths)", () => {
  for (const p of EXPECTED_PATHS) {
    assert.ok(yamlText.includes(`${p}:`), `yaml missing path ${p}`);
  }
  for (const [p, methods] of Object.entries(spec.paths)) {
    for (const op of Object.values(methods)) {
      assert.ok(yamlText.includes(op.operationId), `yaml missing operationId ${op.operationId} for ${p}`);
    }
  }
});

test("renderApiDocsPage: loads swagger-ui from the pinned jsdelivr version, nonce on every inline/loaded script", () => {
  const html = renderApiDocsPage("TESTNONCE123");
  assert.match(html, /swagger-ui-dist@5\.33\.0\/swagger-ui\.css/);
  assert.match(html, /<script nonce="TESTNONCE123" src="https:\/\/cdn\.jsdelivr\.net\/npm\/swagger-ui-dist@5\.33\.0\/swagger-ui-bundle\.js">/);
  assert.match(html, /url:\s*"\/api\/openapi\.json"/);
  // Every <script> tag on this page carries the nonce (no un-nonced inline script).
  const scriptTags = html.match(/<script\b[^>]*>/g) || [];
  assert.ok(scriptTags.length >= 3);
  for (const tag of scriptTags) assert.match(tag, /nonce="TESTNONCE123"/);
});
