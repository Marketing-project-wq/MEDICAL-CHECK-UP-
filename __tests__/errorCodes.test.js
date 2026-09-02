import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getErrorMessage, getStrings, LANGS } from "../src/shared/i18n.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Every `code: "..."` literal the server can ever send back to the browser
// must resolve to a real, fully-translated message in every language — the
// whole point of the code-based error scheme (Tahap 2) is that the server
// never ships user-facing text directly, so a client-side language switch
// always covers errors too, and an unmapped code can never leak as-is.
function extractCodes(relPath) {
  const src = readFileSync(path.join(ROOT, relPath), "utf8");
  const codes = new Set();
  for (const m of src.matchAll(/code:\s*"([a-z_]+)"/g)) codes.add(m[1]);
  return codes;
}

test("every server-emitted error code translates to a real message in both languages", () => {
  const codes = new Set([
    ...extractCodes("src/server/scanHandlers.js"),
    ...extractCodes("src/server/mcuAnalyze.js"),
    "invalid_request", // readJsonBody rejection fallback (err.code || "invalid_request")
    "service_unavailable", // src/server.js: /api/scan when scan handlers aren't configured
    "not_mcu", // mcuAnalyze.js: built via a ternary, not a `code: "..."` literal the regex above catches
    "incomplete_mcu", // same as above
  ]);
  assert.ok(codes.size > 10, "sanity check: expected to find a good number of error codes");
  for (const code of codes) {
    for (const lang of LANGS) {
      const msg = getErrorMessage(lang, code);
      assert.equal(typeof msg, "string");
      assert.ok(msg.length > 0, `${lang}: empty message for code "${code}"`);
    }
  }
});

test("an unrecognized code falls back to the generic error message, never raw/undefined", () => {
  for (const lang of LANGS) {
    assert.equal(getErrorMessage(lang, "some_future_code_nobody_mapped_yet"), getStrings(lang).errGeneric);
    assert.equal(getErrorMessage(lang, undefined), getStrings(lang).errGeneric);
  }
});
