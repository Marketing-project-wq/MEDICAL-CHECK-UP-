import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMedicalPage } from "../src/views/medical.js";

test("renderMedicalPage: faithful medical.html markup with the expected id/class hooks", () => {
  const page = renderMedicalPage({ lang: "en" });
  assert.match(page.title, /Medical Record/);
  const h = page.bodyHtml;
  // The wrapper the client + scoped CSS key off, and the class hooks the port needs.
  assert.ok(h.includes('class="medrec"') && h.includes("data-medrec"), "medrec wrapper");
  assert.ok(h.includes('id="mcufile"'), "hidden file input");
  assert.ok(h.includes('id="result"'), "result grid");
  assert.ok(h.includes('id="mcuHistoryCard"') && h.includes('id="list"'), "history toggle + list");
  assert.ok(h.includes('id="mcuModalBg"') && h.includes('id="mcuModalBody"'), "detail modal");
  // Consult banner → the real Sport Clinic booking line (not fabricated).
  assert.ok(h.includes('href="https://booking.20fit.id/clinic"'), "clinic consult link");
});

test("renderMedicalPage: mobile camera capture (input capture=environment + data-act button)", () => {
  const en = renderMedicalPage({ lang: "en" }).bodyHtml;
  assert.ok(en.includes('id="mcucam"') && en.includes('capture="environment"'), "rear-camera input");
  assert.ok(en.includes('data-act="capture"') && en.includes("Take a Photo Now"), "camera button (EN)");
  const id = renderMedicalPage({ lang: "id" }).bodyHtml;
  assert.ok(id.includes("Ambil Foto Sekarang"), "camera button (ID)");
});

test("renderMedicalPage: CSP-safe — no inline event handlers, only data-act hooks", () => {
  const h = renderMedicalPage({ lang: "en" }).bodyHtml;
  assert.ok(!/on(click|change|load|error)\s*=/.test(h), "no inline on*= handlers (strict CSP)");
  assert.ok(h.includes('data-act="pick-file"'), "upload uses data-act");
  assert.ok(h.includes('data-act="toggle-all"'), "history toggle uses data-act");
  assert.ok(h.includes('data-act="close-modal"'), "modal close uses data-act");
});

test("renderMedicalPage: localized (EN + ID) labels match my.20fit.id/medical", () => {
  const en = renderMedicalPage({ lang: "en" }).bodyHtml;
  assert.ok(en.includes("Medical Record") && en.includes("Upload Medical Check-Up") && en.includes("Talk to a 20FIT doctor"), "EN labels");
  const id = renderMedicalPage({ lang: "id" });
  assert.ok(id.bodyHtml.includes("Rekam Medis") && id.bodyHtml.includes("Unggah Medical Check-Up") && id.bodyHtml.includes("Konsultasi dengan dokter 20FIT"), "ID labels");
  assert.ok(id.bodyHtml.includes('data-lang="id"'), "lang marker for the client");
});
