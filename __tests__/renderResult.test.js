import { test } from "node:test";
import assert from "node:assert/strict";
import { renderResult } from "../src/shared/renderResult.js";
import { getRenderLabels } from "../src/shared/i18n.js";
import { getSample } from "../src/shared/sampleData.js";

const tId = getRenderLabels("id");
const tEn = getRenderLabels("en");

test("renders the fictional sample (both languages) with all sections", () => {
  for (const [lang, t] of [["id", tId], ["en", tEn]]) {
    const html = renderResult(getSample(lang), t);
    assert.match(html, /class="mcu-result"/, `${lang}: wrapper`);
    assert.match(html, /mcu-disclaimer/, `${lang}: disclaimer always shown`);
    assert.match(html, /class="pill pill-attn"/, `${lang}: high/warning status highlighted`);
    assert.match(html, /mcu-checklist/, `${lang}: checklist present`);
    assert.match(html, /mcu-doctor-notes/, `${lang}: doctor notes present`);
  }
});

test("the disclaimer is fixed copy — identical regardless of what the result contains", () => {
  const withDoctorNotes = renderResult({ ...getSample("id"), doctor_notes: "Sesuatu yang lain" }, tId);
  const withoutDoctorNotes = renderResult({ ...getSample("id"), doctor_notes: "" }, tId);
  const extractDisclaimer = (html) => html.match(/<div class="mcu-disclaimer"[^]*?<\/div>/)[0];
  assert.equal(extractDisclaimer(withDoctorNotes), extractDisclaimer(withoutDoctorNotes));
});

test("sample and a real-shaped result use the identical code path (same wrapper)", () => {
  const realShaped = {
    patient_name: "Someone",
    reviewed_at: "2026-08-30",
    grade: "A",
    summary: "Ringkasan singkat.",
    metrics: [{ label: "Glukosa", value: "95 mg/dL", status: "ok", note: "Dalam rentang normal." }],
    recommendations: ["Sayur"],
    checklist: [],
    doctor_notes: "",
  };
  const sampleHtml = renderResult(getSample("id"), tId);
  const realHtml = renderResult(realShaped, tId);
  const wrapper = /^<article class="mcu-result">/;
  assert.match(sampleHtml.trim(), wrapper);
  assert.match(realHtml.trim(), wrapper);
  // Empty checklist/doctor-notes sections are simply omitted, never crash.
  assert.doesNotMatch(realHtml, /mcu-checklist/);
  assert.doesNotMatch(realHtml, /mcu-doctor-notes/);
});

test("escapes untrusted strings (no HTML injection)", () => {
  const evil = {
    patient_name: "\"><img src=x onerror=alert(1)>",
    reviewed_at: "<script>alert(1)</script>",
    grade: "A",
    summary: "<b>bold</b>",
    metrics: [{ label: "<i>x</i>", value: "<svg/onload=1>", status: "high", note: "</td>break" }],
    recommendations: ["<script>alert(2)</script>"],
    checklist: [{ icon: "<x>", title: "<script>alert(3)</script>", reason: "</section>", priority: "high", duration: null, location: null }],
    doctor_notes: "<x>",
  };
  const html = renderResult(evil, tId);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<svg\/onload/);
  assert.match(html, /&lt;script&gt;/);
});

test("does not throw on empty / partial input", () => {
  assert.doesNotThrow(() => renderResult({}, tId));
  assert.doesNotThrow(() => renderResult(null, tEn));
  assert.doesNotThrow(() => renderResult({ metrics: null, checklist: undefined }, tId));
});
