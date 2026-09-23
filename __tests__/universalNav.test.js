import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(path.join(__dirname, "..", "public", "universal-nav.js"), "utf8");

test("universal-nav lists all 16 ecosystem products in five groups", () => {
  const labels = [
    "Home", "My 20FIT", "Recipe",
    "Calorie Tracker", "MCU Scanner", "Body Scan",
    "Workout", "Progress", "Media",
    "Photo", "Ticket", "Talent",
    "Book Class", "Book Coach", "Book Doctor", "Book Recovery",
  ];
  for (const l of labels) assert.ok(SRC.includes('"' + l + '"'), `missing product ${l}`);
  for (const g of ["main", "health", "activity", "event", "booking"]) {
    assert.ok(SRC.includes('"' + g + '"'), `missing group ${g}`);
  }
  // Grouped labels shown in the mega-menu.
  for (const g of ["Health", "Activity", "Event", "Booking"]) assert.ok(SRC.includes('"' + g + '"'));
});

test("current-app highlight covers medicalscanner + the recepie typo domain", () => {
  for (const host of ["20fit.id", "my.20fit.id", "recipe.20fit.id", "recepie.20fit.id", "medicalscanner.20fit.id", "calorietracker.20fit.id"]) {
    assert.ok(SRC.includes('"' + host + '"'), `host map missing ${host}`);
  }
  assert.ok(SRC.includes("medicalscanner.20fit.id"), "medicalscanner mapped");
  assert.ok(SRC.includes("Kamu di sini"), "active-app 'you are here' marker");
});

test("branded product icons are served locally (with a line-icon fallback)", () => {
  assert.ok(SRC.includes("/img/products/"), "branded PNG path");
  assert.ok(/var ICON_BASE = ""/.test(SRC), "icons load same-origin on medicalscanner (public/img/products)");
  assert.ok(/NO_ART\s*=\s*\{[^}]*bodyscan[^}]*talent/.test(SRC), "Body Scan + Talent fall back to line icons");
  assert.ok(SRC.includes("renderAppsInto"), "exposes the embeddable grid used by the header dropdown");
});

test("login target is overridable so MCU uses its OWN local login", () => {
  assert.ok(SRC.includes("__20FIT_NAV_LOGIN__"), "reads the host page's login override");
  assert.ok(SRC.includes("LOGIN_URL"), "uses the resolved login url for Masuk/logout");
});

test("no emoji — icons are inline SVG or branded artwork only (spec: jangan pakai emoji)", () => {
  const emoji = SRC.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2022}\u{22EE}]/gu);
  assert.equal(emoji, null, `found emoji/bullet chars: ${emoji && emoji.join(" ")}`);
  assert.ok(SRC.includes("<svg"), "uses inline SVG icons");
});

test("exposes UniversalNav + a Masuk sign-in for logged-out visitors", () => {
  assert.ok(SRC.includes("window.UniversalNav"), "exposes the mount/renderAppsInto API");
  assert.ok(SRC.includes("Masuk"), "logged-out sign-in button");
  assert.ok(SRC.includes("Keluar"), "logout row");
  assert.ok(SRC.includes("/profile") && SRC.includes("/purchases") && SRC.includes("/settings"), "profile-hub links");
});
