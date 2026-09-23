import { test } from "node:test";
import assert from "node:assert/strict";
import { buildResultHTML, bmiInfo, esc } from "../src/shared/renderMedical.js";

// A realistic stored result in the REAL my.20fit.id/medical shape (parameters +
// abnormal_findings + eating_plan + exercise_plan), the shape both apps persist
// in my20fit_mcu_result — so this renderer stays sync-compatible with that page.
const RESULT = {
  document_type: "Hasil Lab",
  patient_name: "Budi Santoso",
  date: "2026-09-01",
  summary: "Sebagian besar nilai normal.",
  disclaimer: "Ini bukan pengganti dokter.",
  parameters: [
    { label: "Kolesterol Total", value: "240 mg/dL", status: "attention", direction: "high", normal_range: "<200", explanation: "Sedikit tinggi." },
    { label: "Gula Darah Puasa", value: "90 mg/dL", status: "normal", normal_range: "70-100" },
    { label: "Hemoglobin", value: "11 g/dL", status: "attention", direction: "low", normal_range: "13-17" },
  ],
  abnormal_findings: [
    { label: "Kolesterol Total", value: "240", severity: "sedang", why_it_matters: "Risiko jantung.", what_to_do: "Kurangi gorengan." },
  ],
  eating_plan: ["Perbanyak sayur & serat."],
  exercise_plan: ["Jalan cepat 30 menit/hari."],
  unreadable: [],
};

test("buildResultHTML renders the real shape: summary, findings, params, arrows, programs, disclaimer", () => {
  const html = buildResultHTML(RESULT, { lang: "id", profile: { weight_kg: 80, height_cm: 170, gender: "male", age: 35 } });
  // Overall summary + doc meta
  assert.match(html, /Ringkasan Keseluruhan/);
  assert.ok(html.includes("Hasil Lab") && html.includes("Budi Santoso") && html.includes("2026-09-01"), "document meta line");
  // Findings card (there is one abnormal finding)
  assert.match(html, /Yang Perlu Diperhatikan/);
  assert.ok(html.includes("Risiko jantung.") && html.includes("Kurangi gorengan."), "why/what-to-do");
  // Parameter rows + directional arrows (high ↑, low ↓)
  assert.match(html, /Detail Parameter/);
  assert.ok(html.includes("240 mg/dL ↑"), "high value shows ↑");
  assert.ok(html.includes("11 g/dL ↓"), "low value shows ↓");
  assert.ok(html.includes("Normal: &lt;200") || html.includes("Normal: <200".replace("<", "&lt;")), "normal range shown (escaped)");
  // Eating + exercise + programs
  assert.match(html, /Rencana Makan/);
  assert.match(html, /Rekomendasi Olahraga/);
  assert.match(html, /Program yang Disarankan/);
  // Findings present → the clinic booking (Doctor Consultation) is prepended
  assert.ok(html.includes("booking.20fit.id/clinic"), "clinic booking when findings exist");
  // Disclaimer always
  assert.ok(html.includes("Ini bukan pengganti dokter."), "disclaimer from result");
  // BMI tile (80kg/170cm = 27.7 Overweight)
  assert.ok(html.includes(">27.7<"), "BMI value tile");
  assert.ok(html.includes("Berlebih"), "BMI label (ID)");
});

test("buildResultHTML EN localizes labels + shows the all-normal line when no findings", () => {
  const clean = { ...RESULT, abnormal_findings: [], parameters: [{ label: "Glucose", value: "90", status: "normal", normal_range: "70-100" }] };
  const html = buildResultHTML(clean, { lang: "en", profile: null });
  assert.match(html, /Overall Summary/);
  assert.match(html, /Parameter Details/);
  assert.ok(html.includes("All readable values look within the normal range."), "no-findings line (EN)");
  assert.ok(!html.includes("Needs Attention"), "no attention card when no findings");
  // No profile → no BMI tiles
  assert.ok(!html.includes(">BMI<"), "no BMI tile without profile");
});

test("buildResultHTML escapes AI/OCR text (no HTML injection)", () => {
  const evil = { parameters: [{ label: "<img src=x onerror=alert(1)>", value: "\"><b>x</b>", status: "normal", normal_range: "-" }], abnormal_findings: [], eating_plan: [], exercise_plan: [] };
  const html = buildResultHTML(evil, { lang: "en", profile: null });
  assert.ok(!html.includes("<img src=x onerror=alert(1)>"), "raw script/img not present");
  assert.ok(html.includes("&lt;img src=x onerror=alert(1)&gt;"), "escaped instead");
});

test("bmiInfo uses standard thresholds", () => {
  assert.equal(bmiInfo(50, 170).label.en, "Underweight"); // 17.3
  assert.equal(bmiInfo(65, 170).label.en, "Normal"); // 22.5
  assert.equal(bmiInfo(80, 170).label.en, "Overweight"); // 27.7
  assert.equal(bmiInfo(95, 170).label.en, "Obese"); // 32.9
  assert.equal(bmiInfo(0, 170), null);
  assert.equal(bmiInfo(70, 0), null);
});

test("esc handles nullish + special chars", () => {
  assert.equal(esc(null), "");
  assert.equal(esc('<a href="x">&'), "&lt;a href=&quot;x&quot;&gt;&amp;");
});
