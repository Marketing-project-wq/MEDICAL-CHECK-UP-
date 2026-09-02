// Pure, dependency-free BMI + waist-to-height helpers for the health quiz.
// STANDARD thresholds only — nothing invented:
//   - BMI = weight(kg) / height(m)²  (WHO).
//   - Categories: WHO international by default; WHO Asia-Pacific cut-offs
//     available via {asia:true} (both are official WHO guidance — the
//     Asia-Pacific set is commonly used for Indonesian populations).
//   - Waist-to-height ratio (WHtR): the well-established "keep your waist to
//     less than half your height" rule (cut-off 0.5).
// All UI copy (labels, the "BMI is a rough indicator" context, the doctor
// escalation) lives in i18n — this file only does the math + returns stable
// category KEYS, so it is easy to unit-test and can never drift into a medical
// verdict on its own.

/** @returns {number|null} BMI, or null for invalid input. */
export function bmiValue(heightCm, weightKg) {
  const h = Number(heightCm) / 100;
  const w = Number(weightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;
  return w / (h * h);
}

/**
 * @returns {"under"|"normal"|"over"|"obese"|null} stable category key.
 * WHO international cut-offs: <18.5 / 18.5–24.9 / 25–29.9 / ≥30.
 * WHO Asia-Pacific (asia:true):  <18.5 / 18.5–22.9 / 23–24.9 / ≥25.
 */
export function bmiCategory(bmi, { asia = false } = {}) {
  if (bmi == null || !Number.isFinite(bmi)) return null;
  const cut = asia ? [18.5, 23, 25] : [18.5, 25, 30];
  if (bmi < cut[0]) return "under";
  if (bmi < cut[1]) return "normal";
  if (bmi < cut[2]) return "over";
  return "obese";
}

/** @returns {number|null} waist-to-height ratio, or null for invalid input. */
export function whtrValue(waistCm, heightCm) {
  const wa = Number(waistCm);
  const h = Number(heightCm);
  if (!Number.isFinite(wa) || !Number.isFinite(h) || wa <= 0 || h <= 0) return null;
  return wa / h;
}

/** @returns {"ok"|"high"|null} WHtR flag using the standard 0.5 cut-off. */
export function whtrFlag(ratio) {
  if (ratio == null || !Number.isFinite(ratio)) return null;
  return ratio < 0.5 ? "ok" : "high";
}

/** Rounds to one decimal for display (e.g. 24.34 → "24.3"). */
export function round1(n) {
  return n == null || !Number.isFinite(n) ? "" : (Math.round(n * 10) / 10).toFixed(1);
}
