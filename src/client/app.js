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
    if (scroll) resultSlot.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
      showResult(data.result);
      await saveResult(data.result, setStatus);
      await loadHistory();
    } catch (e) {
      console.error("MCU scan request failed:", e);
      setBusy(false);
      if (e && e.name === "AbortError") setStatus(S.errGeneric, true);
      else setStatus(S.errNetwork, true);
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
    if (restoreState.display && restoreState.display.type === "result") {
      showResult(restoreState.display.data, { scroll: false });
    }
    analyzeBtn.disabled = !canAnalyze();
  }

  applySessionState(currentSession);
  return {
    applySessionState,
    captureState: () => ({
      fileName: selectedFile ? fileNameEl.textContent : null,
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
