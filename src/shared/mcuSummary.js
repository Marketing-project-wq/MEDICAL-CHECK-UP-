// Pure helper: tally an MCU result's per-marker metrics into at-a-glance
// counts. Shared by the result renderer (summary strip) and the browser client
// (history cards). It ONLY counts the status the my.20fit backend already
// assigned to each marker — no thresholds, no diagnosis, no clinical inference.
// Dependency-free ESM.

// Markers the backend flagged as outside the printed reference range (or that
// it asked to look at). These are what the "needs attention" views surface.
const ATTENTION = new Set(["high", "low", "warning"]);

/**
 * @param {Array<{status?: string}>} metrics  the result's `metrics` array
 * @returns {{total:number, ok:number, high:number, low:number, warning:number, attention:number, unknown:number}}
 */
export function summarizeMetrics(metrics) {
  const out = { total: 0, ok: 0, high: 0, low: 0, warning: 0, attention: 0, unknown: 0 };
  if (!Array.isArray(metrics)) return out;
  for (const m of metrics) {
    out.total++;
    const s = m && typeof m.status === "string" ? m.status : "";
    if (s === "ok") out.ok++;
    else if (s === "high") out.high++;
    else if (s === "low") out.low++;
    else if (s === "warning") out.warning++;
    else out.unknown++;
    if (ATTENTION.has(s)) out.attention++;
  }
  return out;
}

/**
 * True when a "needs attention only" filter is worth offering — there is at
 * least one flagged marker AND at least one that isn't (nothing to filter
 * otherwise).
 * @param {{total:number, attention:number}} summary
 */
export function attentionFilterUseful(summary) {
  return !!summary && summary.attention > 0 && summary.total > summary.attention;
}
