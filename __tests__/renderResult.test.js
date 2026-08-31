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
    assert.match(html, /class="pill pill-attn"/, `${lang}: attention highlighted`);
    assert.match(html, /mcu-card/, `${lang}: abnormal cards`);
    assert.match(html, /mcu-plans/, `${lang}: plans present`);
  }
});

test("sample and a real-shaped result use the identical code path (same wrapper)", () => {
  const realShaped = {
    document_type: "Hasil Lab",
    patient_name: "Someone",
    date: "2026-08-30",
    summary: "Ringkasan singkat.",
    parameters: [
      { label: "Glukosa", value: "95 mg/dL", normal_range: "70-100 mg/dL", status: "normal", direction: "normal", explanation: "Gula darah." },
    ],
    abnormal_findings: [],
    eating_plan: ["Sayur"],
    exercise_plan: [],
    lifestyle_plan: [],
    unreadable: [],
    disclaimer: "Bukan diagnosis.",
  };
  const sampleHtml = renderResult(getSample("id"), tId);
  const realHtml = renderResult(realShaped, tId);
  const wrapper = /^<article class="mcu-result">/;
  assert.match(sampleHtml.trim(), wrapper);
  assert.match(realHtml.trim(), wrapper);
  // Empty abnormal/plan sections are simply omitted, never crash.
  assert.doesNotMatch(realHtml, /mcu-abnormal/);
  assert.doesNotMatch(realHtml, /mcu-plans[^]*Olahraga/);
});

test("escapes untrusted strings (no HTML injection)", () => {
  const evil = {
    document_type: "<script>alert(1)</script>",
    patient_name: "\"><img src=x onerror=alert(1)>",
    date: null,
    summary: "<b>bold</b>",
    parameters: [
      { label: "<i>x</i>", value: "<svg/onload=1>", normal_range: "a&b", status: "attention", direction: "high", explanation: "</td>break" },
    ],
    abnormal_findings: [],
    eating_plan: [],
    exercise_plan: [],
    lifestyle_plan: [],
    unreadable: [],
    disclaimer: "<x>",
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
  assert.doesNotThrow(() => renderResult({ parameters: null, abnormal_findings: undefined }, tId));
});
