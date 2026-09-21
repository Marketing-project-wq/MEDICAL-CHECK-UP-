// Manual MCU entry → the same result SHAPE the my.20fit /api/analyze-mcu
// backend returns, so renderResult() displays a typed-in reading identically to
// a scanned one. IMPORTANT (spec: "jangan ngarang"): nothing medical is
// invented here. Status is derived ONLY by comparing the number the member
// typed against the reference range the member typed; no built-in thresholds,
// no grade, no per-marker "explanation". If either side is missing or
// unparseable the status is "unknown" — never guessed. Dependency-free ESM.

// Normalize the dashes / operators a user might paste from a lab report.
function norm(s) {
  return String(s == null ? "" : s)
    .replace(/[‒-―−]/g, "-") // ‒ – — ― − → -
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .trim();
}

// First numeric token (accepts comma decimals). null when there is no number
// (e.g. a qualitative result like "Negatif" / "Reactive").
function firstNumber(s) {
  const m = norm(s).replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/**
 * Parse a reference-range string into bounds, or null if not parseable.
 * Supports "a-b", "a – b", "<x", "<=x", ">x", ">=x".
 * @returns {{min:(number|null), max:(number|null), minInclusive?:boolean, maxInclusive?:boolean}|null}
 */
export function parseRange(rangeStr) {
  const r = norm(rangeStr);
  if (!r) return null;
  let m;
  if ((m = r.match(/^(<=|<)\s*(-?\d+(?:\.\d+)?)$/))) {
    return { min: null, max: Number(m[2]), maxInclusive: m[1] === "<=" };
  }
  if ((m = r.match(/^(>=|>)\s*(-?\d+(?:\.\d+)?)$/))) {
    return { min: Number(m[2]), max: null, minInclusive: m[1] === ">=" };
  }
  if ((m = r.match(/^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/))) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return { min: Math.min(a, b), max: Math.max(a, b), minInclusive: true, maxInclusive: true };
  }
  return null;
}

/**
 * Deterministic status of a value against a typed reference range.
 * @returns {"ok"|"high"|"low"|"unknown"}
 */
export function statusFromRange(value, rangeStr) {
  const n = firstNumber(value);
  const range = parseRange(rangeStr);
  if (n === null || !range) return "unknown";
  if (range.max != null && (range.maxInclusive ? n > range.max : n >= range.max)) return "high";
  if (range.min != null && (range.minInclusive ? n < range.min : n <= range.min)) return "low";
  return "ok";
}

/**
 * Build the analyze-mcu result shape from manual rows. `rangeLabel` prefixes the
 * (user-typed) reference range shown in the note column; `summary` is a fixed,
 * non-diagnostic caption. No grade / recommendations / checklist are produced.
 * @returns {object} result compatible with renderResult()
 */
export function buildManualResult({ patientName, examDate, laboratory, rows, rangeLabel = "Ref:", summary = "" } = {}) {
  const metrics = (Array.isArray(rows) ? rows : [])
    .map((r) => {
      const label = String((r && r.label) || "").trim();
      const rawValue = String((r && r.value) || "").trim();
      const unit = String((r && r.unit) || "").trim();
      const range = String((r && r.range) || "").trim();
      return {
        label,
        value: [rawValue, unit].filter(Boolean).join(" "),
        status: statusFromRange(rawValue, range),
        note: range ? `${rangeLabel} ${range}` : "",
      };
    })
    .filter((m) => m.label || m.value);
  return {
    patient_name: String((patientName || "")).trim() || null,
    reviewed_at: String((examDate || "")).trim() || null,
    summary: summary || "",
    metrics,
    recommendations: [],
    checklist: [],
    doctor_notes: "",
    source: "manual",
    laboratory: String((laboratory || "")).trim() || null,
  };
}
