// medicalcheckup.20fit.id browser client.
// - Consumes the SSO fragment token (setSession + scrub).
// - Anonymous: education + sample only (upload UI is never rendered).
// - Member: upload → preprocess → POST my.20fit.id/api/mcu → render → save →
//   history; optional translate. AI is only ever called on the server.

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { renderResult } from "/shared/renderResult.js";
import { getStrings, getRenderLabels } from "/shared/i18n.js";
import { buildLoginUrl } from "/shared/returnTo.js";

const CFG = window.__MCU_CONFIG__ || {};
const LANG = CFG.lang === "en" ? "en" : "id";
const S = getStrings(LANG);

const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const API = (CFG.apiBase || "").replace(/\/$/, "");

const supabase =
  CFG.supabaseUrl && CFG.supabaseAnonKey
    ? createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false, // we handle the SSO fragment ourselves
          storageKey: "mcu20fit-auth",
        },
      })
    : null;

// ── Session state for the translate toggle ────────────────────────────────
let selectedFile = null;
let resultsByLang = {}; // { id: {...}, en: {...} }
let displayLang = LANG;

// ── Helpers ───────────────────────────────────────────────────────────────
function currentReturnTo() {
  return window.location.origin + window.location.pathname + window.location.search;
}

function updateLoginCta() {
  const cta = document.querySelector('[data-role="login-cta"]');
  if (cta && CFG.loginUrl) cta.href = buildLoginUrl(CFG.loginUrl, currentReturnTo());
}

async function consumeSsoFragment() {
  const hash = window.location.hash || "";
  if (!hash.includes("access_token")) return;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  // Always scrub the fragment from the URL/history, even on failure.
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

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// ── Member UI ───────────────────────────────────────────────────────────
function memberMarkup(email) {
  return `
    <div class="member-signedin">
      <span class="member-who">${S.signedInAs}: <strong></strong></span>
      <button class="btn btn-ghost" data-act="signout" type="button">${S.signOut}</button>
    </div>
    <p class="section-intro">${S.memberIntroMember}</p>
    <div class="uploader" data-role="dropzone">
      <input type="file" accept="image/jpeg,image/png,application/pdf" hidden data-role="file">
      <button class="btn btn-ghost" data-act="choose" type="button">${S.uploadCta}</button>
      <div class="upload-hint">${S.uploadHint}</div>
      <div class="file-name" data-role="filename" hidden></div>
    </div>
    <div class="member-actions">
      <button class="btn btn-primary" data-act="analyze" type="button" disabled>${S.analyzeButton}</button>
      <span class="status-msg" data-role="status" role="status" aria-live="polite"></span>
    </div>
    <div class="result-slot" data-role="result-slot" hidden>
      <div class="member-actions">
        <button class="btn btn-ghost" data-act="translate" type="button" hidden></button>
      </div>
      <div data-role="result-body"></div>
    </div>
    <div class="history">
      <h3>${S.historyHeading}</h3>
      <div data-role="history"></div>
    </div>`;
}

function renderMemberUI(root, user) {
  // Hide the anonymous view and inject the member UI (upload only exists here).
  const anon = root.querySelector('[data-role="anon"]');
  if (anon) anon.hidden = true;
  const container = el(`<div class="member-app" data-role="member"></div>`);
  container.innerHTML = memberMarkup();
  root.appendChild(container);

  const q = (sel) => container.querySelector(sel);
  q(".member-who strong").textContent = user.email || user.id;

  const fileInput = q('[data-role="file"]');
  const dropzone = q('[data-role="dropzone"]');
  const fileNameEl = q('[data-role="filename"]');
  const analyzeBtn = q('[data-act="analyze"]');
  const statusEl = q('[data-role="status"]');
  const resultSlot = q('[data-role="result-slot"]');
  const resultBody = q('[data-role="result-body"]');
  const translateBtn = q('[data-act="translate"]');
  const historyEl = q('[data-role="history"]');

  function setStatus(msg, isError) {
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("error", Boolean(isError));
  }
  function setBusy(busy, msg) {
    analyzeBtn.disabled = busy || !selectedFile;
    if (busy) statusEl.innerHTML = `<span class="spinner"></span>${msg || ""}`;
    else setStatus(msg || "");
  }

  function pickFile(file) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setStatus(S.errType, true);
    if (file.size > MAX_INPUT_BYTES) return setStatus(S.errTooLarge, true);
    selectedFile = file;
    fileNameEl.hidden = false;
    fileNameEl.textContent = file.name;
    analyzeBtn.disabled = false;
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

  function showResult(lang) {
    const result = resultsByLang[lang];
    if (!result) return;
    displayLang = lang;
    resultBody.innerHTML = renderResult(result, getRenderLabels(lang));
    resultSlot.hidden = false;
    // Translate toggle: offer the other language.
    translateBtn.hidden = false;
    translateBtn.textContent = lang === LANG ? S.translateButton : S.translateBack;
  }

  translateBtn.addEventListener("click", async () => {
    const target = displayLang === "id" ? "en" : "id";
    if (resultsByLang[target]) return showResult(target);
    const token = await accessToken();
    if (!token) return needLogin(setStatus);
    translateBtn.disabled = true;
    setStatus(S.translating);
    try {
      const res = await fetch(`${API}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lang: target, data: resultsByLang[displayLang] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data.error || S.errGeneric, true);
        return;
      }
      resultsByLang[target] = data.result;
      setStatus("");
      showResult(target);
    } catch {
      setStatus(S.errNetwork, true);
    } finally {
      translateBtn.disabled = false;
    }
  });

  analyzeBtn.addEventListener("click", () => runAnalyze());

  async function runAnalyze() {
    if (!selectedFile) return setStatus(S.errFile, true);
    setBusy(true, S.analyzing);
    resultSlot.hidden = true;
    try {
      const { preprocess } = await import("./preprocess.js");
      const { dataUrl, mime } = await preprocess(selectedFile);
      const token = await accessToken();
      if (!token) {
        setBusy(false);
        return needLogin(setStatus);
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 95000);
      let res;
      try {
        res = await fetch(`${API}/api/mcu`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ file: dataUrl, mime, lang: LANG }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBusy(false);
        setStatus(data.error || S.errGeneric, true);
        if (data.session_expired) needLogin(setStatus);
        return;
      }
      resultsByLang = { [LANG]: data.result };
      displayLang = LANG;
      setBusy(false);
      showResult(LANG);
      await saveResult(data.result, setStatus);
      await loadHistory();
    } catch (e) {
      setBusy(false);
      if (e && e.name === "AbortError") setStatus(S.errGeneric, true);
      else if (e && e.message === "unsupported_type") setStatus(S.errType, true);
      else setStatus(S.errNetwork, true);
    }
  }

  async function loadHistory() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("my20fit_mcu_result")
        .select("id, result, analyzed_at, created_at")
        .eq("auth_user_id", user.id)
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
        const label = (row.result && (row.result.document_type || row.result.summary)) || "MCU";
        const item = el(
          `<div class="history-item" role="button" tabindex="0"><div class="history-date"></div><div class="history-label"></div></div>`,
        );
        item.querySelector(".history-date").textContent = formatDate(when);
        item.querySelector(".history-label").textContent = String(label).slice(0, 90);
        item.addEventListener("click", () => {
          resultsByLang = { [LANG]: row.result };
          displayLang = LANG;
          showResult(LANG);
          resultSlot.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        historyEl.appendChild(item);
      }
    } catch {
      /* history is best-effort */
    }
  }

  // Kick off initial history load.
  loadHistory();
}

function formatDate(v) {
  try {
    return new Date(v).toLocaleString(LANG === "en" ? "en-GB" : "id-ID");
  } catch {
    return String(v || "");
  }
}

async function accessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data && data.session ? data.session.access_token : null;
}

function needLogin(setStatus) {
  setStatus(S.memberIntroAnon, true);
  const anon = document.querySelector('[data-role="anon"]');
  if (anon) anon.hidden = false;
}

async function saveResult(result, setStatus) {
  if (!supabase) return;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    // File is NOT stored — only the JSON result (spec §6). file_path left null.
    const { error } = await supabase.from("my20fit_mcu_result").insert({
      auth_user_id: user.id,
      result,
      analyzed_at: new Date().toISOString(),
    });
    if (error) setStatus(S.errSave, true);
  } catch {
    setStatus(S.errSave, true);
  }
}

// ── Boot ────────────────────────────────────────────────────────────────
async function boot() {
  updateLoginCta();
  await consumeSsoFragment();

  const root = document.getElementById("member-app");
  if (!root || !supabase) return; // anonymous / misconfigured → public mode only

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session && session.user) {
    renderMemberUI(root, session.user);
  }
  // else: leave the server-rendered anonymous view (login CTA) as-is.
}

boot();
