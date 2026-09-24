import { test } from "node:test";
import assert from "node:assert/strict";
import { renderLandingPage } from "../src/views/landing.js";

const CTX = {
  bookingUrl: "https://my.20fit.id/book-doctor",
  clinicContactUrl: "https://wa.me/6281234567890",
  clinicAddress: "20FIT Sports Clinic — Jl. Sinabung No. 9, Kebayoran Baru, Jakarta Selatan",
  myOrigin: "https://my.20fit.id",
};

test("landing (EN): all seven sections + double CTA + disclaimer", () => {
  const p = renderLandingPage({ lang: "en", ...CTX });
  const h = p.bodyHtml;
  assert.ok(h.includes('class="lp"'), "landing wrapper");
  // 1 hero + CTAs, 2 how, 3 what-you-get, 4 preview, 5 trust, 6 faq, 7 clinic
  assert.match(h, /Understand Your Medical Check-Up Results/, "hero headline");
  assert.match(h, /How It Works/, "how-it-works");
  assert.match(h, /What You Get/, "benefits");
  assert.match(h, /Result Preview/, "preview heading");
  assert.match(h, /Powered by 20FIT/, "trust badges");
  assert.match(h, /<details class="lp-faq-item">/, "faq uses native details (CSP-safe)");
  assert.match(h, /Need a follow-up consultation\?/, "clinic section");
  // Double CTA → real auth routes
  assert.ok(h.includes('href="/login"') && h.includes('href="/register"'), "login + register CTAs");
  // Hero disclaimer (not a diagnosis)
  assert.match(h, /Not a medical diagnosis/, "hero disclaimer");
});

test("landing preview reuses the real renderer (buildResultHTML output present)", () => {
  const h = renderLandingPage({ lang: "en", ...CTX }).bodyHtml;
  // The preview frame is a .medrec so medical.css styles it exactly like /medical,
  // and it contains real result cards (Overall Summary + a parameter row).
  assert.match(h, /class="medrec lp-preview-frame"/, "preview is a .medrec frame");
  assert.match(h, /Overall Summary/, "preview renders the real overall-summary card");
  assert.match(h, /Total Cholesterol/, "preview shows a sample parameter");
});

test("landing (ID): localized copy, CTAs, and the real clinic address", () => {
  const p = renderLandingPage({ lang: "id", ...CTX });
  const h = p.bodyHtml;
  assert.match(h, /Cara Kerja/, "ID how-it-works");
  assert.match(h, /Contoh Hasil/, "ID preview heading");
  assert.ok(h.includes(">Masuk</a>") && h.includes(">Daftar Gratis</a>"), "ID CTAs");
  // ID auth routes are /id/login, /id/register (they exist server-side)
  assert.ok(h.includes('href="/id/login"') && h.includes('href="/id/register"'), "ID auth hrefs");
  assert.ok(h.includes("Jl. Sinabung No. 9"), "configured clinic address (not fabricated)");
  assert.ok(h.includes("https://wa.me/6281234567890"), "configured WhatsApp contact");
});

test("landing has no fabricated stats and no emoji, no inline handlers", () => {
  const h = renderLandingPage({ lang: "en", ...CTX }).bodyHtml;
  assert.ok(!/\d+\+\s*(scan|Scan)/.test(h), "no fabricated '500+ scans' style count");
  assert.ok(!/on(click|change|load|submit)\s*=/.test(h), "no inline event handlers (strict CSP)");
  // No emoji (RULES.md) — icons are inline SVG only.
  const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2695}]/u;
  assert.ok(!emoji.test(h), "no emoji in the landing markup");
});
