import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(path.join(__dirname, "..", "public", "universal-nav.js"), "utf8");

test("universal-nav bundles all 10 ecosystem apps with their subdomains", () => {
  const urls = [
    "https://20fit.id",
    "https://my.20fit.id",
    "https://recipe.20fit.id",
    "https://calorietracker.20fit.id",
    "https://medicalscanner.20fit.id",
    "https://media.20fit.id",
    "https://workout.20fit.id",
    "https://photo.20fit.id",
    "https://ticket.20fit.id",
    "https://talent.20fit.id",
  ];
  for (const u of urls) assert.ok(SRC.includes('"' + u + '"'), `missing app url ${u}`);
});

test("host map covers every subdomain incl. the recepie typo + www/apex", () => {
  for (const host of ["20fit.id", "www.20fit.id", "recepie.20fit.id", "medicalscanner.20fit.id", "calorietracker.20fit.id"]) {
    assert.ok(SRC.includes('"' + host + '"'), `host map missing ${host}`);
  }
});

test("no emoji — icons are inline SVG only (spec: jangan pakai emoji)", () => {
  const emoji = SRC.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2022}\u{22EE}]/gu);
  assert.equal(emoji, null, `found emoji/bullet chars: ${emoji && emoji.join(" ")}`);
  assert.ok(SRC.includes("<svg"), "uses inline SVG icons");
});

test("exposes the host-page API + profile links to my.20fit + active-state label", () => {
  assert.ok(SRC.includes("window.__20FIT_NAV_API__"), "exposes setUser/logout API");
  assert.ok(SRC.includes("/profile") && SRC.includes("/purchases") && SRC.includes("/settings"), "profile hub links");
  assert.ok(SRC.includes("Kamu di sini"), "active app 'you are here' marker");
  assert.ok(SRC.includes("Masuk"), "logged-out sign-in button");
});
