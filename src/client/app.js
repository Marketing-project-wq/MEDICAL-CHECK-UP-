// medicalcheckup.20fit.id browser client.
// - Consumes the SSO fragment token (setSession + scrub).
// - A single upload widget serves BOTH anonymous visitors and members, but
//   they now go through THIS APP'S OWN SERVER (POST /api/scan), not
//   my.20fit.id directly:
//     member  → server proxies to my.20fit.id/api/analyze-mcu and returns
//               the full result immediately (unchanged from the visitor's
//               perspective); this client still saves it via Supabase (RLS).
//     anon    → server runs the SAME analysis, but HOLDS the full result
//               server-side and returns only a safe teaser (parameter count,
//               categories, timestamp) + a scan_id. The full result is never
//               sent to an anonymous browser. Creating an account and
//               claiming the scan_id (POST /api/scan/claim) is the only way
//               to see it — it's held up to 24h, then auto-deleted.
// AI is only ever called from THIS APP'S SERVER — never the browser, and no
// AI key or Supabase service-role key ships here either way.

import { renderResult } from "/shared/renderResult.js";
import { getStrings, getRenderLabels, getErrorMessage } from "/shared/i18n.js";
import { buildLoginUrl } from "/shared/returnTo.js";
import { LANG_STORAGE_KEY } from "/shared/langPref.js";
import { THEME_STORAGE_KEY } from "/shared/themePref.js";
import { renderHomePage } from "/views/pages.js";
import { renderLayout } from "/views/layout.js";

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
 * Switches the entire page's language in place — no navigation, no reload
 * (per spec: the toggle must not lose scroll position, focus, or whatever
 * the visitor was in the middle of). Re-renders <main>, the header, and the
 * footer using the EXACT SAME render functions the server uses
 * (renderHomePage / renderLayout, both dependency-free and browser-safe —
 * see the /views/ static route in server.js) rather than a hand-maintained
 * list of "translatable" DOM nodes, so there is no way for a spot to be
 * missed independently of what the server itself would have rendered for
 * that language.
 */
async function applyLanguage(newLang) {
  const root = document.getElementById("member-app");
  const captured = root && currentWidget ? currentWidget.captureState() : null;

  LANG = newLang;
  S = getStrings(newLang);
  T = getRenderLabels(newLang);

  const canonicalPath = newLang === "id" ? "/id" : "/";
  const returnToUrl = currentReturnTo();
  const page = renderHomePage({
    lang: newLang,
    publicOrigin: CFG.publicOrigin,
    loginUrl: CFG.loginUrl,
    canonicalPath,
  });
  const fullHtml = renderLayout({
    lang: newLang,
    strings: S,
    title: page.title,
    description: page.description,
    canonicalPath,
    publicOrigin: CFG.publicOrigin,
    bodyHtml: "",
    clientConfig: CFG,
    nonce: "x", // parsed only, never executed — DOMParser never runs scripts
  });
  const parsed = new DOMParser().parseFromString(fullHtml, "text/html");

  document.title = page.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", page.description);
  document.documentElement.lang = S.htmlLang;

  const newHeader = parsed.querySelector(".site-header");
  const oldHeader = document.querySelector(".site-header");
  if (newHeader && oldHeader) oldHeader.replaceWith(newHeader);

  const newFooter = parsed.querySelector(".site-footer");
  const oldFooter = document.querySelector(".site-footer");
  if (newFooter && oldFooter) oldFooter.replaceWith(newFooter);

  const main = document.querySelector("main");
  if (main) main.innerHTML = page.bodyHtml;

  // Re-wire everything the innerHTML/replaceWith swaps above just tore out
  // the listeners for.
  setLogosForTheme(currentTheme());
  wireThemeToggle();
  wireLangToggleButtons();
  updateLoginCta();
  const newRoot = document.getElementById("member-app");
  if (newRoot) {
    currentWidget = setupUploadWidget(newRoot, captured);
    await currentWidget.applySessionState(currentSession);
  }

  try {
    localStorage.setItem(LANG_STORAGE_KEY, newLang);
  } catch {
    /* best effort */
  }
  history.replaceState(null, "", canonicalPath + location.search + location.hash);
}

const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const ANON_ID_KEY = "mcu20fit-anon-id";
const PENDING_SCAN_KEY = "mcu20fit-pending-scan";

// Loaded lazily (not a static top-level import) and guarded: a static
// `import ... from "https://cdn.jsdelivr.net/..."` would fail this ENTIRE
// module — nothing in this file would run at all, not even the theme/
// language toggle wiring below — the instant that one CDN request fails
// for any reason (network hiccup, ad-blocker, CDN outage). This way, a
// failure here only disables Supabase-dependent features (auth, history,
// saving results); the base page (including both toggles) stays working.
let supabase = null;
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

function getAnonId() {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID(); // storage unavailable (private mode etc.) — best effort
  }
}

function getPendingScan() {
  try {
    const raw = localStorage.getItem(PENDING_SCAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function setPendingScan(value) {
  try {
    if (value) localStorage.setItem(PENDING_SCAN_KEY, JSON.stringify(value));
    else localStorage.removeItem(PENDING_SCAN_KEY);
  } catch {
    /* best effort */
  }
}

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

/** Builds the locked/blurred teaser view from server-safe fields only — no
 * real value ever passes through here, so there is nothing for DevTools to
 * reveal beyond what's already visibly rendered. */
function buildLockedTeaser(teaser, loginHref) {
  const wrap = el("article", { className: "mcu-result locked-teaser" });
  wrap.appendChild(
    el("div", { className: "mcu-disclaimer" }, [
      el("strong", { text: `${T.disclaimerTitle}: ` }),
      document.createTextNode(T.disclaimerText),
    ]),
  );
  wrap.appendChild(el("h3", { text: S.teaserHeading }));
  const stats = el("div", { className: "teaser-stats" });
  stats.appendChild(
    el("div", { className: "teaser-stat" }, [
      el("strong", { text: String(teaser.parameters_detected ?? 0) }),
      el("span", { text: S.teaserParamsLabel }),
    ]),
  );
  if (teaser.scanned_at) {
    stats.appendChild(el("div", { className: "teaser-stat teaser-stat-time", text: formatDate(teaser.scanned_at) }));
  }
  wrap.appendChild(stats);

  if (Array.isArray(teaser.categories) && teaser.categories.length > 0) {
    const chips = el("div", { className: "teaser-categories" });
    for (const cat of teaser.categories) chips.appendChild(el("span", { className: "teaser-chip", text: cat }));
    wrap.appendChild(chips);
  }

  const lockedPanel = el("div", { className: "locked-panel" });
  const placeholderCount = Math.max(3, Math.min(teaser.parameters_detected || 3, 6));
  for (let i = 0; i < placeholderCount; i++) {
    lockedPanel.appendChild(
      el("div", { className: "locked-row" }, [el("span", { className: "locked-row-fake" }), el("span", { className: "locked-row-fake short" })]),
    );
  }
  const overlay = el("div", { className: "locked-overlay" }, [
    el("p", { text: S.teaserLockedNote }),
    el("a", { className: "btn btn-primary", href: loginHref, text: S.teaserUnlockCta }),
  ]);
  lockedPanel.appendChild(overlay);
  wrap.appendChild(lockedPanel);
  return wrap;
}

/**
 * @param {HTMLElement} root
 * @param {{fileName?: string, consentChecked?: boolean, display?: {type: "result"|"teaser", data: object}}} [restoreState]
 *   Carries state across a language switch's full re-render of #member-app
 *   (which otherwise would silently drop the file the visitor had already
 *   picked, or the result/teaser they were already looking at). A
 *   currently-shown *status* message (an error, "analyzing…") is
 *   deliberately NOT restored — it's transient and about to be stale by
 *   definition; anything shown from this point on already uses the new
 *   language.
 */
function setupUploadWidget(root, restoreState) {
  const q = (sel) => root.querySelector(sel);
  const fileInput = q('[data-role="file"]');
  const dropzone = q('[data-role="dropzone"]');
  const fileNameEl = q('[data-role="filename"]');
  const consentBox = q('[data-role="consent"]');
  const consentRow = q('[data-role="consent-row"]');
  const analyzeBtn = q('[data-act="analyze"]');
  const statusEl = q('[data-role="status"]');
  const resultSlot = q('[data-role="result-slot"]');
  const resultBody = q('[data-role="result-body"]');
  const historyWrap = q('[data-role="history-wrap"]');
  const historyEl = q('[data-role="history"]');
  const signedinEl = q('[data-role="signedin"]');
  const anonHintEl = q('[data-role="anon-login-hint"]');
  const whoEl = q('[data-role="who"]');
  const loginHref = root.dataset.loginHref || "#";

  function isMember() {
    return Boolean(currentSession && currentSession.user);
  }

  function canAnalyze() {
    return Boolean(selectedFile) && (isMember() || consentBox.checked);
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

  async function applySessionState(session) {
    currentSession = session;
    const member = isMember();
    signedinEl.hidden = !member;
    consentRow.hidden = member;
    anonHintEl.hidden = member;
    historyWrap.hidden = !member;
    if (member) whoEl.textContent = session.user.email || session.user.id;
    analyzeBtn.disabled = !canAnalyze();
    // Tahap 5: a logged-in member must never see a "create an account" pitch
    // anywhere on the page, not just inside this widget.
    document.querySelectorAll('[data-role="cta-banner"]').forEach((banner) => {
      banner.hidden = member;
    });
    if (member) {
      await tryClaimPendingScan();
      loadHistory();
    }
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
  consentBox.addEventListener("change", () => {
    analyzeBtn.disabled = !canAnalyze();
  });

  q('[data-act="signout"]').addEventListener("click", async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } finally {
      window.location.reload();
    }
  });

  let lastDisplay = null; // tracked so a language switch can re-render this same result/teaser in the new language, instead of it silently vanishing

  function showResult(result, { scroll = true } = {}) {
    lastDisplay = { type: "result", data: result };
    resultBody.innerHTML = renderResult(result, T);
    resultSlot.hidden = false;
    if (scroll) resultSlot.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showLockedTeaser(teaser, { scroll = true } = {}) {
    lastDisplay = { type: "teaser", data: teaser };
    resultBody.innerHTML = "";
    resultBody.appendChild(buildLockedTeaser(teaser, loginHref));
    resultSlot.hidden = false;
    if (scroll) resultSlot.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  analyzeBtn.addEventListener("click", () => runAnalyze());

  async function runAnalyze() {
    if (!selectedFile) return setStatus(S.errFile, true);
    if (!isMember() && !consentBox.checked) return setStatus(S.errConsent, true);
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

    // Step 2: send to our own server, which proxies to my.20fit.id.
    try {
      const token = await accessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      else headers["X-Anon-Id"] = getAnonId();

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

      if (data.mode === "member") {
        showResult(data.result);
        await saveResult(data.result, setStatus);
        await loadHistory();
        return;
      }

      // mode === "anon"
      if (data.limit_reached) {
        setStatus(getErrorMessage(LANG, data.code), true);
        return;
      }
      setPendingScan({ anon_id: getAnonId(), scan_id: data.scan_id });
      showLockedTeaser(data.teaser);
    } catch (e) {
      console.error("MCU scan request failed:", e);
      setBusy(false);
      if (e && e.name === "AbortError") setStatus(S.errGeneric, true);
      else setStatus(S.errNetwork, true);
    }
  }

  /** After signup/login, unlock a scan that was held while anonymous. */
  async function tryClaimPendingScan() {
    const pending = getPendingScan();
    if (!pending) return;
    const token = await accessToken();
    if (!token) return;
    try {
      const res = await fetch("/api/scan/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(pending),
      });
      const data = await res.json().catch(() => ({}));
      setPendingScan(null); // one attempt only, whatever the outcome
      if (res.ok && data.ok) {
        showResult(data.result);
        setStatus(S.teaserUnlockedNote);
      }
    } catch {
      setPendingScan(null);
    }
  }

  async function saveResult(result, setStatusFn) {
    if (!supabase || !currentSession) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("my20fit_mcu_result").insert({
        auth_user_id: user.id,
        result,
        analyzed_at: new Date().toISOString(),
      });
      if (error) setStatusFn(S.errSave, true);
    } catch {
      setStatusFn(S.errSave, true);
    }
  }

  async function loadHistory() {
    if (!supabase || !currentSession) return;
    try {
      const { data, error } = await supabase
        .from("my20fit_mcu_result")
        .select("id, result, analyzed_at, created_at")
        .eq("auth_user_id", currentSession.user.id)
        .order("analyzed_at", { ascending: false })
        .limit(20);
      if (error) return;
      if (!data || data.length === 0) {
        historyEl.innerHTML = `<p class="section-intro">${S.historyEmpty}</p>`;
        return;
      }
      historyEl.innerHTML = "";
      for (const row of data) {
        const when = row.analyzed_at || row.created_at || "";
        const label = (row.result && (row.result.summary || row.result.patient_name)) || "MCU";
        const item = el("div", { className: "history-item", role: "button", tabindex: "0" }, [
          el("div", { className: "history-date", text: formatDate(when) }),
          el("div", { className: "history-label", text: String(label).slice(0, 90) }),
        ]);
        item.addEventListener("click", () => showResult(row.result));
        historyEl.appendChild(item);
      }
    } catch {
      /* history is best-effort */
    }
  }

  if (restoreState) {
    if (restoreState.fileName) {
      fileNameEl.hidden = false;
      fileNameEl.textContent = restoreState.fileName;
    }
    if (restoreState.consentChecked) consentBox.checked = true;
    if (restoreState.display) {
      if (restoreState.display.type === "result") showResult(restoreState.display.data, { scroll: false });
      else if (restoreState.display.type === "teaser") showLockedTeaser(restoreState.display.data, { scroll: false });
    }
    analyzeBtn.disabled = !canAnalyze();
  }

  applySessionState(currentSession);
  return {
    applySessionState,
    captureState: () => ({
      fileName: selectedFile ? fileNameEl.textContent : null,
      consentChecked: consentBox.checked,
      display: lastDisplay,
    }),
  };
}

async function boot() {
  wireLangToggleButtons();
  wireThemeToggle();
  updateLoginCta();
  supabase = await initSupabase();
  await consumeSsoFragment();

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
