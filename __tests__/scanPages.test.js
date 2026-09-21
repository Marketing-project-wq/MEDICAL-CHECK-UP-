import { test } from "node:test";
import assert from "node:assert/strict";
import { renderHistoryPage, renderScanDetailPage } from "../src/views/pages.js";

const LOGIN = "https://my.20fit.id/login";

test("renderHistoryPage: member-gated shell, client-hydrated, no private data in SSR", () => {
  const page = renderHistoryPage({
    lang: "en",
    loginUrl: LOGIN,
    returnToUrl: "https://medicalscanner.20fit.id/history",
  });
  assert.match(page.title, /MCU Scan History/);
  assert.ok(page.bodyHtml.includes('data-mcu-view="history"'), "history view container");
  assert.ok(page.bodyHtml.includes('data-role="login-gate"'), "login gate for guests");
  assert.ok(page.bodyHtml.includes('data-role="login-cta"'), "login CTA");
  assert.ok(page.bodyHtml.includes('data-role="view-body"'), "client-hydrated body");
  assert.ok(page.bodyHtml.includes('href="/check-mcu"'), "back-to-scan link (EN)");
  assert.ok(page.bodyHtml.includes("mcu-view-disclaimer"), "disclaimer block present");
});

test("renderHistoryPage: ID variant links back to /id/check-mcu", () => {
  const page = renderHistoryPage({
    lang: "id",
    loginUrl: LOGIN,
    returnToUrl: "https://medicalscanner.20fit.id/id/history",
  });
  assert.ok(page.bodyHtml.includes('href="/id/check-mcu"'), "ID back link");
  assert.match(page.title, /Riwayat Scan MCU/);
});

test("renderScanDetailPage: carries scan id + gate + clinic CTA + back-to-history", () => {
  const page = renderScanDetailPage({
    lang: "en",
    loginUrl: LOGIN,
    returnToUrl: "https://medicalscanner.20fit.id/scan/x",
    scanId: "11112222-3333-4444-5555-666677778888",
    clinicContactUrl: "https://wa.me/6280012345",
    clinicAddress: "Jl. Test",
  });
  assert.ok(page.bodyHtml.includes('data-mcu-view="scan"'), "scan view container");
  assert.ok(page.bodyHtml.includes('data-scan-id="11112222-3333-4444-5555-666677778888"'), "scan id echoed");
  assert.ok(page.bodyHtml.includes('data-role="login-gate"'), "gate for guests");
  assert.ok(page.bodyHtml.includes('href="/history"'), "back-to-history (EN)");
  assert.ok(page.bodyHtml.includes("wa.me/6280012345"), "clinic contact URL rendered");
});

test("renderScanDetailPage: html-escapes the scan id into the attribute", () => {
  const page = renderScanDetailPage({
    lang: "en",
    loginUrl: LOGIN,
    returnToUrl: "https://x/scan/x",
    scanId: 'a"><script>',
    clinicContactUrl: "",
    clinicAddress: "",
  });
  assert.ok(!page.bodyHtml.includes('a"><script>'), "raw id must never appear unescaped");
  assert.ok(page.bodyHtml.includes("&quot;") && page.bodyHtml.includes("&lt;"), "id is html-escaped");
});

test("renderScanDetailPage: ID variant links back to /id/history", () => {
  const page = renderScanDetailPage({
    lang: "id",
    loginUrl: LOGIN,
    returnToUrl: "https://x/id/scan/y",
    scanId: "aaaabbbbccccdddd",
    clinicContactUrl: "",
    clinicAddress: "",
  });
  assert.ok(page.bodyHtml.includes('href="/id/history"'), "ID back link");
});
