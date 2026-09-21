// medicalcheckup.20fit.id browser client.
// - Consumes the SSO fragment token (setSession + scrub).
// - Enforces spec §0.1 in the browser: the gate is at UPLOAD, not the result.
//   Anonymous visitors get NO uploader at all — only a login CTA that sends
//   them to my.20fit.id/login with a validated return_to. The uploader
//   (file input, analyze, result, history) is revealed ONLY once a real
//   member session is confirmed. A health document is therefore never
//   uploaded or sent for analysis without an account.
//   member  → preprocess in the browser, POST /api/scan with a Bearer token;
//             THIS APP'S OWN SERVER proxies to my.20fit.id/api/analyze-mcu
//             and returns the full result, which the client saves via
//             Supabase (RLS, my20fit_mcu_result).
// AI is only ever called from THIS APP'S SERVER — never the browser, and no
// AI key or Supabase service-role key ships here either way. The server
// (scanHandlers.js) independently refuses any anonymous /api/scan request,
// so the gate holds even if this client is bypassed.

import { renderResult } from "/shared/renderResult.js";
import { summarizeMetrics } from "/shared/mcuSummary.js";
import { buildManualResult } from "/shared/manualMcu.js";
import { relatedCategories, renderRelatedArticles } from "/shared/relatedArticles.js";
import { createMcuService } from "/shared/mcuService.js";
import { getStrings, getRenderLabels, getErrorMessage } from "/shared/i18n.js";
import { buildLoginUrl } from "/shared/returnTo.js";
import { LANG_STORAGE_KEY, equivalentLangPath } from "/shared/langPref.js";
import { THEME_STORAGE_KEY } from "/shared/themePref.js";

const CFG = window.__MCU_CONFIG__ || {};
let LANG = CFG.lang === "id" ? "id" : "en";
let S = getStrings(LANG);
let T = getRenderLabels(LANG);

// Persist the language actually being shown, so a plain internal link (not
// just the explicit EN/ID toggle) also keeps a returning visitor's choice
// sticky — the pre-paint redirect script in layout.js reads this on the
// next page load / next visit and sends them straight to it.
try {
  localStorage.setItem(LANG_STORAGE_KEY, LANG);
} catch {
  /* best effort — storage unavailable (private mode etc.) */
}

function setLogosForTheme(theme) {
  document.querySelectorAll("img.brand-logo").forEach((img) => {
    img.src = theme === "dark" ? CFG.logoDarkUrl : CFG.logoLightUrl;
  });
}

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function wireThemeToggle() {
  const btn = document.querySelector('[data-act="theme-toggle"]');
  if (!btn) return;
  btn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setLogosForTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* best effort */
    }
  });
}

function wireLangToggleButtons() {
  document.querySelectorAll('[data-act="lang"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.lang === "id" ? "id" : "en";
      if (next !== LANG) applyLanguage(next);
    });
  });
}

/**
 * Language toggle: navigate to the SAME page in the other language. A full
 * load is the robust choice now the site spans several page types (landing,
 * home hub, article list, article detail) — the pre-paint redirect script in
 * layout.js applies the stored preference before first paint, so the switch
 * still feels instant, and there's no per-page in-place re-render to keep
 * correct (which previously mis-rendered non-home pages as the home page).
 * The hash is dropped so a returning SSO fragment is never re-processed.
 */
function applyLanguage(newLang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, newLang);
  } catch {
    /* best effort */
  }
  location.assign(equivalentLangPath(location.pathname, newLang) + location.search);
}

const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

// Loaded lazily (not a static top-level import) and guarded: a static
// `import ... from "https://cdn.jsdelivr.net/..."` would fail this ENTIRE
// module — nothing in this file would run at all, not even the theme/
// language toggle wiring below — the instant that one CDN request fails
// for any reason (network hiccup, ad-blocker, CDN outage). This way, a
// failure here only disables Supabase-dependent features (auth, history,
// saving results); the base page (including both toggles) stays working.
let supabase = null;
// The shared MCU data-access layer (src/shared/mcuService.js), created once the
// Supabase client is ready. All save/history/delete DB work goes through this,
// so the exact same logic can live in my.20fit.id/mcu unchanged.
let mcuService = null;
async function initSupabase() {
  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) return null;
  try {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm");
    return createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // we handle the SSO fragment ourselves
        storageKey: "mcu20fit-auth",
      },
    });
  } catch (e) {
    console.error("Failed to load Supabase client (CDN unreachable?):", e);
    return null;
  }
}

let selectedFile = null;
let currentSession = null;
let currentWidget = null;

function currentReturnTo() {
  return window.location.origin + window.location.pathname + window.location.search;
}

function updateLoginCta() {
  document.querySelectorAll('[data-role="login-cta"]').forEach((cta) => {
    if (CFG.loginUrl) cta.href = buildLoginUrl(CFG.loginUrl, currentReturnTo());
  });
}

async function consumeSsoFragment() {
  const hash = window.location.hash || "";
  if (!hash.includes("access_token")) return;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const cleanUrl = window.location.pathname + window.location.search;
  if (access_token && refresh_token && supabase) {
    try {
      await supabase.auth.setSession({ access_token, refresh_token });
    } catch {
      /* fall through — treated as anonymous */
    }
  }
  history.replaceState(null, "", cleanUrl);
}

async function accessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data && data.session ? data.session.access_token : null;
}

function formatDate(v) {
  try {
    return new Date(v).toLocaleString(LANG === "en" ? "en-GB" : "id-ID");
  } catch {
    return String(v || "");
  }
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "className") node.className = v;
    else if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) node.appendChild(child);
  return node;
}

/**
 * @param {HTMLElement} root
 * @param {{fileName?: string, display?: {type: "result", data: object}}} [restoreState]
 *   Carries state across a language switch's full re-render of #member-app
 *   (which otherwise would silently drop the file the visitor had already
 *   picked, or the result they were already looking at). A currently-shown
 *   *status* message (an error, "analyzing…") is deliberately NOT restored —
 *   it's transient and about to be stale by definition; anything shown from
 *   this point on already uses the new language.
 */
function setupUploadWidget(root, restoreState) {
  const q = (sel) => root.querySelector(sel);
  const fileInput = q('[data-role="file"]');
  const dropzone = q('[data-role="dropzone"]');
  const fileNameEl = q('[data-role="filename"]');
  const analyzeBtn = q('[data-act="analyze"]');
  const statusEl = q('[data-role="status"]');
  const resultSlot = q('[data-role="result-slot"]');
  const resultBody = q('[data-role="result-body"]');
  const historyWrap = q('[data-role="history-wrap"]');
  const historyEl = q('[data-role="history"]');
  const signedinEl = q('[data-role="signedin"]');
  const loginGateEl = q('[data-role="login-gate"]');
  const uploaderEl = q('[data-role="uploader"]');
  const whoEl = q('[data-role="who"]');
  const confirmModal = q('[data-role="confirm-modal"]');
  const confirmMismatch = q('[data-role="confirm-name-mismatch"]');
  const confirmNameRow = q('[data-role="confirm-name-row"]');
  const confirmDetectedName = q('[data-role="confirm-detected-name"]');
  const confirmNameDoc = q('[data-role="confirm-name-doc"]');
  const confirmNameAccount = q('[data-role="confirm-name-account"]');
  const confirmGradeRow = q('[data-role="confirm-grade-row"]');
  const confirmGradeEl = q('[data-role="confirm-grade"]');
  const consentInputs = Array.from(root.querySelectorAll('[data-role="consent"]'));
  const confirmSaveBtn = q('[data-act="confirm-save"]');
  const confirmCancelBtn = q('[data-act="confirm-cancel"]');
  const toastEl = q('[data-role="toast"]');
  const loginHref = root.dataset.loginHref || "#";

  function isMember() {
    return Boolean(currentSession && currentSession.user);
  }

  // §0.1: only a confirmed member can ever analyze. No consent-checkbox path
  // for anonymous visitors — there is no anonymous upload at all.
  function canAnalyze() {
    return Boolean(selectedFile) && isMember();
  }

  function setStatus(msg, isError) {
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("error", Boolean(isError));
  }
  function setBusy(busy, msg) {
    analyzeBtn.disabled = busy || !canAnalyze();
    if (busy) statusEl.innerHTML = `<span class="spinner"></span>${msg || ""}`;
    else setStatus(msg || "");
  }

  // Reveal the uploader ONLY for a confirmed member; everyone else (anon, or
  // before the session check resolves) sees the login gate and no file input.
  async function applySessionState(session) {
    currentSession = session;
    const member = isMember();
    signedinEl.hidden = !member;
    uploaderEl.hidden = !member;
    loginGateEl.hidden = member;
    historyWrap.hidden = !member;
    if (member) whoEl.textContent = session.user.email || session.user.id;
    analyzeBtn.disabled = !canAnalyze();
    // A logged-in member must never see a "create an account" pitch anywhere
    // on the page, not just inside this widget.
    document.querySelectorAll('[data-role="cta-banner"]').forEach((banner) => {
      banner.hidden = member;
    });
    if (member) loadHistory();
  }

  function pickFile(file) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setStatus(S.errType, true);
    if (file.size > MAX_INPUT_BYTES) return setStatus(S.errTooLarge, true);
    selectedFile = file;
    fileNameEl.hidden = false;
    fileNameEl.textContent = file.name;
    analyzeBtn.disabled = !canAnalyze();
    setStatus("");
  }

  q('[data-act="choose"]').addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => pickFile(fileInput.files[0]));
  ["dragover", "dragenter"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    }),
  );
  ["dragleave", "drop"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    }),
  );
  dropzone.addEventListener("drop", (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) pickFile(f);
  });

  q('[data-act="signout"]').addEventListener("click", async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } finally {
      window.location.reload();
    }
  });

  let lastDisplay = null; // tracked so a language switch can re-render this same result in the new language, instead of it silently vanishing

  function showResult(result, { scroll = true } = {}) {
    lastDisplay = { type: "result", data: result };
    resultBody.innerHTML = renderResult(result, T);
    resultSlot.hidden = false;
    showRelatedArticles(result);
    if (scroll) resultSlot.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Real nutrition_articles (RLS-public, anon key) relevant to the flagged
  // markers, shown under a result. Best-effort: any failure just shows nothing.
  async function showRelatedArticles(result) {
    const relatedEl = q('[data-role="related-articles"]');
    if (!relatedEl) return;
    relatedEl.innerHTML = "";
    if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) return;
    try {
      const cats = relatedCategories(result && result.metrics);
      const wanted = (cats.length ? cats : ["nutrition-basics", "meal-planning"]).slice(0, 4).join(",");
      const base = String(CFG.supabaseUrl).replace(/\/$/, "");
      const url =
        `${base}/rest/v1/nutrition_articles?select=slug,title,excerpt,category,accent,read_time_minutes` +
        `&is_premium=eq.false&category=in.(${wanted})&order=published_at.desc.nullslast&limit=3`;
      const res = await fetch(url, { headers: { apikey: CFG.supabaseAnonKey, Authorization: `Bearer ${CFG.supabaseAnonKey}` } });
      if (!res.ok) return;
      const rows = await res.json();
      relatedEl.innerHTML = renderRelatedArticles(rows, {
        lang: LANG,
        urlTemplate: CFG.nutritionUrlTemplate,
        heading: S.relatedHeading,
        readLabel: S.readMinutes,
        max: 3,
      });
    } catch {
      /* best effort — related articles are a nice-to-have */
    }
  }

  // ── Confirmation modal (my.20fit parity) ──────────────────────────────
  // After a successful analysis, the member must confirm this is their own
  // document (name check) and tick three consent boxes before the result is
  // saved to their history. Nothing is persisted until they confirm.
  let pendingResult = null;

  function accountName() {
    const u = currentSession && currentSession.user;
    if (!u) return "";
    const m = u.user_metadata || {};
    return String(m.full_name || m.name || (u.email ? u.email.split("@")[0] : "") || "").trim();
  }

  // Loose name match (ported from the my.20fit dashboard): exact, substring, or
  // word-overlap. Only used to decide whether to SHOW a soft warning — it never
  // blocks saving, since a legitimate document can differ from the account name.
  function nameSimilarity(a, b) {
    const n1 = String(a || "").toLowerCase().trim();
    const n2 = String(b || "").toLowerCase().trim();
    if (!n1 || !n2) return 0;
    if (n1 === n2) return 1;
    if (n1.includes(n2) || n2.includes(n1)) return 0.8;
    const w1 = n1.split(/\s+/);
    const w2 = n2.split(/\s+/);
    const overlap = w1.filter((w) => w2.includes(w)).length;
    return overlap / Math.max(w1.length, w2.length);
  }

  function updateConsentState() {
    const all = consentInputs.length > 0 && consentInputs.every((c) => c.checked);
    confirmSaveBtn.disabled = !all;
  }

  function closeConfirm() {
    confirmModal.hidden = true;
    pendingResult = null;
  }

  function openConfirm(result) {
    pendingResult = result;
    const detected = result && result.patient_name ? String(result.patient_name) : "";
    confirmNameRow.hidden = !detected;
    if (detected) confirmDetectedName.textContent = detected;

    const grade = result && result.grade ? String(result.grade) : "";
    confirmGradeRow.hidden = !grade;
    if (grade) confirmGradeEl.textContent = grade;

    const acct = accountName();
    const mismatch = Boolean(detected) && Boolean(acct) && nameSimilarity(detected, acct) < 0.5;
    confirmMismatch.hidden = !mismatch;
    if (mismatch) {
      confirmNameDoc.textContent = detected;
      confirmNameAccount.textContent = acct;
    }

    consentInputs.forEach((c) => {
      c.checked = false;
    });
    updateConsentState();
    confirmModal.hidden = false;
  }

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toastEl.hidden = true;
    }, 3500);
  }

  consentInputs.forEach((c) => c.addEventListener("change", updateConsentState));
  confirmCancelBtn.addEventListener("click", () => {
    closeConfirm();
    setStatus("");
  });
  confirmModal.addEventListener("click", (e) => {
    if (e.target === confirmModal) {
      closeConfirm();
      setStatus("");
    }
  });
  confirmSaveBtn.addEventListener("click", async () => {
    const result = pendingResult;
    closeConfirm();
    if (!result) return;
    showResult(result);
    await saveResult(result, setStatus);
    await loadHistory();
    showToast(S.savedToast);
  });

  analyzeBtn.addEventListener("click", () => runAnalyze());

  async function runAnalyze() {
    // §0.1 defense-in-depth: the analyze button isn't shown to anon, but
    // never preprocess or upload a health document without a member session —
    // send them to login instead.
    if (!isMember()) {
      window.location.href = loginHref;
      return;
    }
    if (!selectedFile) return setStatus(S.errFile, true);
    setBusy(true, S.analyzing);
    resultSlot.hidden = true;

    // Step 1: client-side preprocessing (downscale image / PDF→JPEG via
    // pdf.js). Kept separate from the network step below so a failure here
    // — e.g. an unreadable/encrypted PDF, or pdf.js failing to load — is
    // never mislabeled as a network error.
    let dataUrl, mime;
    try {
      const { preprocess } = await import("./preprocess.js");
      ({ dataUrl, mime } = await preprocess(selectedFile));
    } catch (e) {
      console.error("MCU preprocess failed:", e);
      setBusy(false);
      if (e && e.message === "unsupported_type") setStatus(S.errType, true);
      else setStatus(S.errPreprocess, true);
      return;
    }

    // Step 2: send to our own server (members only), which proxies to
    // my.20fit.id. The Bearer token is required — without it the server
    // rejects the request (auth_required), so we bail to login first.
    try {
      const token = await accessToken();
      if (!token) {
        setBusy(false);
        window.location.href = loginHref;
        return;
      }
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 95000);
      let res;
      try {
        res = await fetch("/api/scan", {
          method: "POST",
          headers,
          body: JSON.stringify({ file: dataUrl, mime, lang: LANG }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setBusy(false);
        setStatus(getErrorMessage(LANG, data.code), true);
        return;
      }

      setBusy(false);
      // Do not persist yet — the member confirms ownership + consent first.
      openConfirm(data.result);
    } catch (e) {
      console.error("MCU scan request failed:", e);
      setBusy(false);
      if (e && e.name === "AbortError") setStatus(S.errGeneric, true);
      else setStatus(S.errNetwork, true);
    }
  }

  async function saveResult(result, setStatusFn) {
    if (!mcuService || !currentSession) return;
    try {
      const res = await mcuService.saveScan(result);
      if (!res.ok) setStatusFn(S.errSave, true);
    } catch {
      setStatusFn(S.errSave, true);
    }
  }

  function gradeClassOf(grade) {
    const g = typeof grade === "string" ? grade.trim().toUpperCase() : "";
    return ["A", "B", "C", "D"].includes(g) ? { letter: g, cls: g.toLowerCase() } : null;
  }

  // Compact per-scan tally for a history card — same status counts as the
  // full result's summary strip (see shared/mcuSummary.js), never a diagnosis.
  function historyCounts(result) {
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

  function historyCard(row) {
    const when = row.analyzed_at || row.created_at || "";
    const result = row.result || {};

    const top = [el("span", { className: "history-date", text: formatDate(when) })];
    const g = gradeClassOf(result.grade);
    if (g) top.push(el("span", { className: `history-grade grade-${g.cls}`, text: g.letter }));

    const mainChildren = [el("div", { className: "history-top" }, top)];
    const counts = historyCounts(result);
    if (counts) mainChildren.push(counts);
    const label = result.patient_name || result.summary || "";
    if (label) mainChildren.push(el("div", { className: "history-label", text: String(label).slice(0, 90) }));

    const main = el("div", { className: "history-main", role: "button", tabindex: "0" }, mainChildren);
    const open = () => showResult(result);
    main.addEventListener("click", open);
    main.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    const del = el("button", {
      className: "history-del",
      type: "button",
      "aria-label": S.historyDelete,
      text: S.historyDelete,
    });
    del.addEventListener("click", () => deleteScan(row.id));

    return el("div", { className: "history-item" }, [main, el("div", { className: "history-actions" }, [del])]);
  }

  async function deleteScan(id) {
    if (!mcuService || !currentSession || !id) return;
    if (typeof window.confirm === "function" && !window.confirm(S.historyDeleteConfirm)) return;
    try {
      const res = await mcuService.deleteScan(id);
      if (!res.ok) {
        setStatus(S.historyDeleteFailed, true);
        return;
      }
      setStatus(S.historyDeleted, false);
      await loadHistory();
    } catch {
      setStatus(S.historyDeleteFailed, true);
    }
  }

  async function loadHistory() {
    if (!mcuService || !currentSession) return;
    try {
      const { scans } = await mcuService.getScanHistory({ limit: 20 });
      if (!scans || scans.length === 0) {
        historyEl.innerHTML = `<p class="section-intro">${S.historyEmpty}</p>`;
        return;
      }
      historyEl.innerHTML = "";
      for (const row of scans) historyEl.appendChild(historyCard(row));
    } catch {
      /* history is best-effort */
    }
  }

  if (restoreState) {
    if (restoreState.fileName) {
      fileNameEl.hidden = false;
      fileNameEl.textContent = restoreState.fileName;
    }
    if (restoreState.display && restoreState.display.type === "result") {
      showResult(restoreState.display.data, { scroll: false });
    }
    analyzeBtn.disabled = !canAnalyze();
  }

  // Manual-entry reader: type MCU values by hand -> the same result view. Status
  // is computed ONLY from the reference range the member types (manualMcu.js) —
  // no thresholds invented, no AI, no service-role key. Members-only (this whole
  // uploader is member-gated, per spec §0.1).
  const manualToggle = q('[data-act="manual-toggle"]');
  const manualForm = q('[data-role="manual-form"]');
  const manualRows = q('[data-role="manual-rows"]');
  const manualAddBtn = q('[data-act="manual-add"]');
  const manualSubmitBtn = q('[data-act="manual-submit"]');
  const mNameEl = q('[data-role="m-name"]');
  const mLabEl = q('[data-role="m-lab"]');

  function manualMakeRow() {
    if (!manualRows) return;
    const inp = (role, ph) =>
      el("input", { className: `manual-input mr-${role}`, type: "text", "data-role": `mr-${role}`, placeholder: ph, "aria-label": ph, autocomplete: "off" });
    const del = el("button", { className: "manual-del", type: "button", "aria-label": S.manualRemoveRow, text: "×" });
    const row = el("div", { className: "manual-row" }, [
      inp("label", S.manualPhLabel),
      inp("value", S.manualPhValue),
      inp("unit", S.manualPhUnit),
      inp("range", S.manualPhRange),
      del,
    ]);
    del.addEventListener("click", () => {
      row.remove();
      if (!manualRows.querySelector(".manual-row")) manualMakeRow();
    });
    manualRows.appendChild(row);
  }

  function manualRunReading() {
    const val = (r, role) => {
      const input = r.querySelector(`[data-role="mr-${role}"]`);
      return input ? input.value : "";
    };
    const rows = [...manualRows.querySelectorAll(".manual-row")]
      .map((r) => ({ label: val(r, "label"), value: val(r, "value"), unit: val(r, "unit"), range: val(r, "range") }))
      .filter((x) => x.label.trim() || x.value.trim());
    if (!rows.length || !rows.some((x) => x.value.trim())) {
      setStatus(S.manualEmpty, true);
      return;
    }
    const result = buildManualResult({
      patientName: mNameEl ? mNameEl.value : "",
      laboratory: mLabEl ? mLabEl.value : "",
      rows,
      rangeLabel: S.manualRangeLabel,
      summary: S.manualResultSummary,
    });
    setStatus("");
    showResult(result);
  }

  if (manualToggle && manualForm) {
    manualToggle.addEventListener("click", () => {
      const opening = manualForm.hidden;
      manualForm.hidden = !opening;
      manualToggle.setAttribute("aria-expanded", String(opening));
      if (opening && manualRows && !manualRows.querySelector(".manual-row")) {
        manualMakeRow();
        manualMakeRow();
        manualMakeRow();
      }
    });
  }
  if (manualAddBtn) manualAddBtn.addEventListener("click", () => manualMakeRow());
  if (manualSubmitBtn) manualSubmitBtn.addEventListener("click", manualRunReading);

  applySessionState(currentSession);
  return {
    applySessionState,
    captureState: () => ({
      fileName: selectedFile ? fileNameEl.textContent : null,
      display: lastDisplay,
    }),
  };
}

const SSO_FN_BASE = (CFG.supabaseUrl ? String(CFG.supabaseUrl).replace(/\/$/, "") : "") + "/functions/v1";

// Redeem a one-time ?sso_token= (minted by another 20fit subdomain via the
// shared sso-generate function) for this member's session, so they arrive
// already signed in. Scrubs the token from the URL either way. This is the
// query-param counterpart to consumeSsoFragment()'s hash-based SSO.
async function consumeSsoQueryToken() {
  const params = new URLSearchParams(location.search);
  const token = params.get("sso_token");
  if (!token) return false;
  try {
    if (supabase && CFG.supabaseUrl && CFG.supabaseAnonKey) {
      const res = await fetch(`${SSO_FN_BASE}/sso-consume`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: CFG.supabaseAnonKey },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        const { access_token, refresh_token } = await res.json();
        if (access_token && refresh_token) await supabase.auth.setSession({ access_token, refresh_token });
      }
    }
  } catch (e) {
    console.error("SSO consume failed:", e);
  }
  params.delete("sso_token");
  const qs = params.toString();
  history.replaceState({}, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  return true;
}

// Navigate to another 20fit subdomain carrying this session via a one-time SSO
// token (sso-generate), so the member isn't asked to sign in again. Same host,
// no session, or any failure -> plain redirect (graceful, never blocks nav).
async function navigateWithSSO(targetUrl) {
  let targetHost;
  try {
    targetHost = new URL(targetUrl).hostname;
  } catch {
    location.href = targetUrl;
    return;
  }
  if (targetHost === location.hostname || !supabase || !CFG.supabaseUrl) {
    location.href = targetUrl;
    return;
  }
  let session = null;
  try {
    ({
      data: { session },
    } = await supabase.auth.getSession());
  } catch {
    /* ignore */
  }
  if (!session) {
    location.href = targetUrl; // not signed in here — let the target gate itself
    return;
  }
  try {
    const res = await fetch(`${SSO_FN_BASE}/sso-generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: CFG.supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ redirect_to: targetHost, refresh_token: session.refresh_token }),
    });
    if (!res.ok) throw new Error("sso-generate " + res.status);
    const { token } = await res.json();
    if (!token) throw new Error("no token");
    const sep = targetUrl.includes("?") ? "&" : "?";
    location.href = `${targetUrl}${sep}sso_token=${encodeURIComponent(token)}`;
  } catch (e) {
    console.error("SSO navigate failed; plain redirect:", e);
    location.href = targetUrl;
  }
}

async function boot() {
  wireLangToggleButtons();
  wireThemeToggle();
  updateLoginCta();

  supabase = await initSupabase();
  mcuService = supabase ? createMcuService(supabase) : null;
  await consumeSsoFragment();
  await consumeSsoQueryToken();

  // Universal nav (public/universal-nav.js): show the signed-in member on the
  // shared top bar and wire its logout to THIS subdomain's session. Best-effort
  // — the bar still renders (with a "Masuk" button) if any of this is absent.
  if (supabase && window.__20FIT_NAV_API__) {
    const nav = window.__20FIT_NAV_API__;
    const loginUrl = CFG.loginUrl || "https://my.20fit.id/auth/login";
    nav.setLoginUrl(loginUrl);
    nav.setNavigate(navigateWithSSO);
    nav.setLogoutHandler(async () => {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore — still send them to login */
      }
      location.href = loginUrl;
    });
    const toNavUser = (session) => {
      const u = session && session.user;
      if (!u) return null;
      const m = u.user_metadata || {};
      return { name: m.full_name || m.name || (u.email ? u.email.split("@")[0] : "") || "User", email: u.email || "" };
    };
    try {
      const { data } = await supabase.auth.getSession();
      nav.setUser(toNavUser(data && data.session));
    } catch {
      /* ignore */
    }
    supabase.auth.onAuthStateChange((_e, session) => nav.setUser(toNavUser(session)));
  }

  // Quiz wizard (quiz hub/detail pages only) — lazy-loaded, and given the
  // already-initialized Supabase client so it can tell a signed-in member
  // apart from an anonymous visitor without doing its own CDN load.
  if (document.querySelector('[data-role="quiz-wizard"]')) {
    import("./quizWizard.js")
      .then((m) => m.setupQuizWizard(document, CFG, supabase))
      .catch((e) => console.error("quiz wizard module failed to load:", e));
  }

  // Standalone member-only routes (/history, /scan/:id) — hydrated by a separate
  // lazy-loaded module so the uploader page stays untouched. Reuses the shared
  // mcuService + renderResult so data and look match my.20fit.id/mcu exactly.
  const scanView = document.getElementById("mcu-scan-view");
  if (scanView) {
    import("./scanViews.js")
      .then((m) => m.setupScanViews(scanView, { supabase, mcuService, lang: LANG }))
      .catch((e) => console.error("scan views module failed to load:", e));
  }

  const root = document.getElementById("member-app");
  if (!root) return;

  currentWidget = setupUploadWidget(root);

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await currentWidget.applySessionState(session);

    supabase.auth.onAuthStateChange((_event, session) => {
      currentWidget.applySessionState(session);
    });
  }
}

boot();
