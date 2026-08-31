// medicalcheckup.20fit.id browser client.
// - Consumes the SSO fragment token (setSession + scrub).
// - A single upload widget serves BOTH anonymous visitors and members:
//     anonymous  → consent checkbox required, calls my.20fit.id/api/mcu with
//                  NO Authorization header, result shown once and never saved
//                  (no history is possible without an account).
//     member     → same widget, existing Bearer-authenticated flow, result
//                  saved to my20fit_mcu_result (RLS) and shown in history.
// AI is only ever called from the browser to my.20fit.id — never from this
// app's own server, and no AI key ships here either way.

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { renderResult } from "/shared/renderResult.js";
import { getStrings, getRenderLabels } from "/shared/i18n.js";
import { getSample } from "/shared/sampleData.js";
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

let selectedFile = null;
let resultsByLang = {}; // { id: {...}, en: {...} }
let displayLang = LANG;
let currentSession = null;

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

function setupUploadWidget(root) {
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
  const ephemeralNote = q('[data-role="ephemeral-note"]');
  const translateBtn = q('[data-act="translate"]');
  const historyWrap = q('[data-role="history-wrap"]');
  const historyEl = q('[data-role="history"]');
  const signedinEl = q('[data-role="signedin"]');
  const anonHintEl = q('[data-role="anon-login-hint"]');
  const whoEl = q('[data-role="who"]');

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

  function applySessionState(session) {
    currentSession = session;
    const member = isMember();
    signedinEl.hidden = !member;
    consentRow.hidden = member;
    anonHintEl.hidden = member;
    historyWrap.hidden = !member;
    if (member) whoEl.textContent = session.user.email || session.user.id;
    analyzeBtn.disabled = !canAnalyze();
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

  function showResult(lang, opts) {
    const result = resultsByLang[lang];
    if (!result) return;
    displayLang = lang;
    resultBody.innerHTML = renderResult(result, getRenderLabels(lang));
    resultSlot.hidden = false;
    ephemeralNote.hidden = !(opts && opts.ephemeral);
    translateBtn.hidden = false;
    translateBtn.textContent = lang === LANG ? S.translateButton : S.translateBack;
    resultSlot.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  let lastWasEphemeral = false;

  q('[data-act="sample"]').addEventListener("click", () => {
    resultsByLang = { [LANG]: getSample(LANG) };
    lastWasEphemeral = false;
    setStatus("");
    showResult(LANG, { ephemeral: false });
  });

  translateBtn.addEventListener("click", async () => {
    const target = displayLang === "id" ? "en" : "id";
    if (resultsByLang[target]) return showResult(target, { ephemeral: lastWasEphemeral });
    const token = await accessToken();
    if (!token) {
      // Anonymous results are never translated server-side (that endpoint
      // requires a member session) — just note it instead of blocking.
      setStatus(S.errGeneric, true);
      return;
    }
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
      showResult(target, { ephemeral: lastWasEphemeral });
    } catch {
      setStatus(S.errNetwork, true);
    } finally {
      translateBtn.disabled = false;
    }
  });

  analyzeBtn.addEventListener("click", () => runAnalyze());

  async function runAnalyze() {
    if (!selectedFile) return setStatus(S.errFile, true);
    if (!isMember() && !consentBox.checked) return setStatus(S.errConsent, true);
    setBusy(true, S.analyzing);
    resultSlot.hidden = true;
    try {
      const { preprocess } = await import("./preprocess.js");
      const { dataUrl, mime } = await preprocess(selectedFile);
      const token = await accessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 95000);
      let res;
      try {
        res = await fetch(`${API}/api/mcu`, {
          method: "POST",
          headers,
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
        return;
      }
      resultsByLang = { [LANG]: data.result };
      displayLang = LANG;
      lastWasEphemeral = !isMember();
      setBusy(false);
      showResult(LANG, { ephemeral: lastWasEphemeral });
      if (isMember()) {
        await saveResult(data.result, setStatus);
        await loadHistory();
      }
    } catch (e) {
      setBusy(false);
      if (e && e.name === "AbortError") setStatus(S.errGeneric, true);
      else if (e && e.message === "unsupported_type") setStatus(S.errType, true);
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
      // File is NOT stored — only the JSON result (spec §6). file_path left null.
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
        const label = (row.result && (row.result.document_type || row.result.summary)) || "MCU";
        const item = document.createElement("div");
        item.className = "history-item";
        item.setAttribute("role", "button");
        item.tabIndex = 0;
        item.innerHTML = `<div class="history-date"></div><div class="history-label"></div>`;
        item.querySelector(".history-date").textContent = formatDate(when);
        item.querySelector(".history-label").textContent = String(label).slice(0, 90);
        item.addEventListener("click", () => {
          resultsByLang = { [LANG]: row.result };
          lastWasEphemeral = false;
          showResult(LANG, { ephemeral: false });
        });
        historyEl.appendChild(item);
      }
    } catch {
      /* history is best-effort */
    }
  }

  applySessionState(currentSession);
  return { applySessionState };
}

async function boot() {
  updateLoginCta();
  await consumeSsoFragment();

  const root = document.getElementById("member-app");
  if (!root) return;

  const widget = setupUploadWidget(root);

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    widget.applySessionState(session);

    supabase.auth.onAuthStateChange((_event, session) => {
      widget.applySessionState(session);
    });
  }
}

boot();
