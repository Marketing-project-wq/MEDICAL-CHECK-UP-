// Standalone member-only views for the deep-linkable /history and /scan/:id
// routes. Kept deliberately separate from the uploader widget (app.js) so those
// live pages are untouched. Reuses the SAME shared renderResult() and the same
// history-* CSS classes as the uploader, so a saved scan and the history list
// look identical here, on the scan tool, and on my.20fit.id/mcu. All data is
// read through the shared mcuService (RLS-scoped to the signed-in member).

import { renderResult } from "/shared/renderResult.js";
import { summarizeMetrics } from "/shared/mcuSummary.js";
import { getStrings, getRenderLabels } from "/shared/i18n.js";

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "className") node.className = v;
    else if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) if (child) node.appendChild(child);
  return node;
}

export function setupScanViews(root, { supabase, mcuService, lang }) {
  const S = getStrings(lang);
  const T = getRenderLabels(lang);
  const view = root.getAttribute("data-mcu-view");
  const gateEl = root.querySelector('[data-role="login-gate"]');
  const bodyEl = root.querySelector('[data-role="view-body"]');
  if (!bodyEl) return;

  const idPrefix = lang === "id" ? "/id" : "";
  const scanHref = (id) => idPrefix + "/scan/" + encodeURIComponent(id);
  const historyHref = root.getAttribute("data-history-href") || idPrefix + "/history";

  const fmtDate = (v) => {
    try {
      return new Date(v).toLocaleString(lang === "en" ? "en-GB" : "id-ID");
    } catch {
      return String(v || "");
    }
  };
  const gradeOf = (grade) => {
    const g = typeof grade === "string" ? grade.trim().toUpperCase() : "";
    return ["A", "B", "C", "D"].includes(g) ? g : null;
  };

  // Same compact status tally as the uploader's history cards (shared
  // summarizeMetrics + the same .history-counts / .hc chip classes).
  function countsRow(result) {
    const c = summarizeMetrics(result && result.metrics);
    if (!c.total) return null;
    const chip = (cls, text) => el("span", { className: `hc hc-${cls}`, text });
    const chips = [chip("ok", `${c.ok} ${T.statusOk}`)];
    if (c.high > 0) chips.push(chip("attn", `▲ ${c.high}`));
    if (c.low > 0) chips.push(chip("attn", `▼ ${c.low}`));
    if (c.warning > 0) chips.push(chip("attn", `! ${c.warning}`));
    if (c.unknown > 0) chips.push(chip("unk", `? ${c.unknown}`));
    return el("div", { className: "history-counts" }, chips);
  }

  // ── History list ─────────────────────────────────────────────────────────
  function historyRow(row) {
    const result = row.result || {};
    const when = row.analyzed_at || row.created_at || "";
    const top = [el("span", { className: "history-date", text: fmtDate(when) })];
    const g = gradeOf(result.grade);
    if (g) top.push(el("span", { className: `history-grade grade-${g.toLowerCase()}`, text: g }));

    const main = [el("div", { className: "history-top" }, top)];
    const counts = countsRow(result);
    if (counts) main.push(counts);
    const label = result.patient_name || result.summary || "";
    if (label) main.push(el("div", { className: "history-label", text: String(label).slice(0, 90) }));

    // A real link (deep-linkable, keyboard-accessible) into the detail route.
    const open = el("a", { className: "history-main", href: scanHref(row.id) }, main);

    const del = el("button", {
      className: "history-del",
      type: "button",
      "aria-label": S.historyDelete,
      text: S.historyDelete,
    });
    del.addEventListener("click", async (e) => {
      e.preventDefault();
      if (typeof window.confirm === "function" && !window.confirm(S.historyDeleteConfirm)) return;
      const res = await mcuService.deleteScan(row.id);
      if (res && res.ok) renderHistory();
      else if (typeof window.alert === "function") window.alert(S.historyDeleteFailed);
    });

    return el("div", { className: "history-item" }, [open, el("div", { className: "history-actions" }, [del])]);
  }

  async function renderHistory() {
    bodyEl.innerHTML = "";
    bodyEl.appendChild(el("p", { className: "section-intro", text: S.scanLoading }));
    let scans = [];
    try {
      ({ scans } = await mcuService.getScanHistory({ limit: 50 }));
    } catch {
      scans = [];
    }
    bodyEl.innerHTML = "";
    if (!scans.length) {
      bodyEl.appendChild(el("p", { className: "section-intro", text: S.historyEmpty }));
      return;
    }
    for (const row of scans) bodyEl.appendChild(historyRow(row));
  }

  // ── Single scan detail ───────────────────────────────────────────────────
  async function renderDetail(id) {
    bodyEl.innerHTML = "";
    bodyEl.appendChild(el("p", { className: "section-intro", text: S.scanLoading }));
    let detail = null;
    try {
      detail = await mcuService.getScanDetail(id);
    } catch {
      detail = null;
    }
    if (!detail || !detail.result) {
      bodyEl.innerHTML = "";
      bodyEl.appendChild(el("p", { className: "section-intro", text: S.scanNotFound }));
      return;
    }
    // Identical shared renderer as the live analysis (disclaimer is part of it).
    bodyEl.innerHTML = renderResult(detail.result, T);

    const del = el("button", { className: "btn btn-ghost history-del", type: "button", text: S.historyDelete });
    del.addEventListener("click", async () => {
      if (typeof window.confirm === "function" && !window.confirm(S.historyDeleteConfirm)) return;
      const res = await mcuService.deleteScan(id);
      if (res && res.ok) location.assign(historyHref);
      else if (typeof window.alert === "function") window.alert(S.historyDeleteFailed);
    });
    bodyEl.appendChild(el("div", { className: "mcu-view-actions" }, [del]));
  }

  function isMember(session) {
    return Boolean(session && session.user);
  }

  async function apply(session) {
    const member = isMember(session);
    if (gateEl) gateEl.hidden = member;
    bodyEl.hidden = !member;
    if (!member || !mcuService) return;
    if (view === "history") await renderHistory();
    else if (view === "scan") await renderDetail(root.getAttribute("data-scan-id"));
  }

  (async () => {
    let session = null;
    if (supabase) {
      try {
        ({
          data: { session },
        } = await supabase.auth.getSession());
      } catch {
        session = null;
      }
      supabase.auth.onAuthStateChange((_e, s) => apply(s));
    }
    await apply(session);
  })();
}
