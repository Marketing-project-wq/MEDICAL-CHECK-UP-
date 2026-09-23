// Medical Record controller — a faithful port of my.20fit.id/medical's inline
// <script> (profile20fit/medical.html), so the member experience on
// medicalscanner.20fit.id behaves exactly like the real page: upload → analyse
// via /api/mcu → render → save to my20fit_mcu_result → history toggle + detail
// modal → two-language AI translation → auto-show the latest result.
//
// It reuses THIS app's already-initialised Supabase client (passed in by app.js,
// same "mcu20fit-auth" session) and the shared renderer (renderMedical.js) so a
// scan here and a scan on my.20fit.id/medical are the same row and render the
// same way. The one departure from the source is CSP-safety: the source's inline
// onclick="…" handlers (page shell AND generated rows/banners) become data-act
// hooks dispatched by one delegated listener — this app serves a strict CSP.

import { buildResultHTML } from "../shared/renderMedical.js";
import { preprocess } from "./preprocess.js";

const CFG = window.__MCU_CONFIG__ || {};

// Bilingual picker — medical.html's L(). LANG is fixed per page (the route is
// /medical for EN and /id/medical for ID; the header's language toggle navigates
// between them), so there is no in-page onChange to handle.
export function setupMedical(root, { supabase, lang }) {
  const LANG = lang === "id" ? "id" : "en";
  const L = (o) => (o && (o[LANG] != null ? o[LANG] : o.en)) || "";
  const CALORIES_URL = (CFG.apiBase || "https://my.20fit.id") + "/calories.html#mealideas";

  const q = (sel) => root.querySelector(sel);
  const resultBox = q('[data-role="result"]');
  const listEl = q('[data-role="list"]');
  const toggleLabel = q('[data-role="toggle-label"]');
  const scanNote = q('[data-role="open-all"]') || q("#mcuScanNote");
  const fileInput = q('[data-role="mcufile"]');
  const modalBg = q('[data-role="modal-bg"]');
  const modalTitleEl = q('[data-role="modal-title"]');
  const modalBodyEl = q('[data-role="modal-body"]');

  let user = null;
  let profile = null;
  let history = [];

  async function token() {
    try { const { data } = await supabase.auth.getSession(); return (data.session && data.session.access_token) || null; }
    catch (e) { return null; }
  }
  // Profile for the BMI/gender/age tiles (my20fit_profile — same table my.20fit reads).
  async function loadProfile() {
    try {
      const { data } = await supabase.from("my20fit_profile").select("weight_kg,height_cm,gender,age").eq("auth_user_id", user.id).limit(1);
      profile = (data && data[0]) || null;
    } catch (e) { profile = null; }
  }

  function render(res) { return buildResultHTML(res, { lang: LANG, profile, caloriesUrl: CALORIES_URL }); }

  // Read a file as a data URL — used only as the PDF fallback (mirrors medical.html).
  function readData(f) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); }); }

  async function analyzeMCU(f) {
    if (!f) return;
    const okType = String(f.type || "").startsWith("image/") || String(f.type || "").includes("pdf");
    if (!okType) { resultBox.innerHTML = '<div class="card" style="color:var(--red)">' + L({ en: "Only a medical check-up file is allowed — a photo (JPG/PNG) or PDF.", id: "Hanya file medical check-up yang boleh — foto (JPG/PNG) atau PDF." }) + "</div>"; fileInput.value = ""; return; }
    const sig = "mcu_" + (f.name || "") + "_" + f.size + "_" + (f.lastModified || 0);
    try { const cached = localStorage.getItem(sig); if (cached) { showResult(JSON.parse(cached)); fileInput.value = ""; return; } } catch (e0) {}
    resultBox.innerHTML = '<div class="card"><div class="muted">' + L({ en: "Compressing & analysing document…", id: "Mengompres & menganalisa dokumen…" }) + "</div></div>";

    let url, mime;
    try {
      if (String(f.type).includes("pdf")) {
        try { const pp = await preprocess(f); url = pp.dataUrl; mime = pp.mime; }
        catch (e2) { url = await readData(f); mime = f.type; } // fallback: send raw PDF
      } else { const pp = await preprocess(f); url = pp.dataUrl; mime = pp.mime; }
    } catch (e3) { resultBox.innerHTML = '<div class="card" style="color:var(--red)">' + L({ en: "Couldn't read the file. Try another.", id: "Gagal membaca file. Coba file lain." }) + "</div>"; fileInput.value = ""; return; }

    try {
      const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 95000);
      const tk = await token();
      const r = await fetch("/api/mcu", { method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json", Authorization: "Bearer " + (tk || "") }, body: JSON.stringify({ file: url, mime: mime, lang: LANG }) });
      clearTimeout(to);
      const j = await r.json().catch(() => null);
      if (!r.ok || !j || !j.result) throw new Error((j && j.error) || L({ en: "Failed to analyse document", id: "Gagal menganalisa dokumen" }));
      j.result._lang = LANG;
      showResult(j.result);
      try { localStorage.setItem(sig, JSON.stringify(j.result)); } catch (e1) {}
      // Store both languages so a later toggle / history is instant (text only; numbers identical).
      try {
        const _oth = LANG === "id" ? "en" : "id";
        const _alt = await aiTranslate(_oth, j.result);
        if (_alt) { const _altm = mergeTrans(j.result, _alt); _altm._lang = _oth; j.result._alt = _altm; transCache[_oth] = _altm; try { localStorage.setItem(sig, JSON.stringify(j.result)); } catch (e8) {} }
      } catch (e9) {}
      // Save to the account (same table my.20fit.id/medical writes).
      let saveErr = null; const nowISO = new Date().toISOString();
      try { const { error } = await supabase.from("my20fit_mcu_result").insert({ auth_user_id: user.id, result: j.result, analyzed_at: nowISO }); saveErr = error; } catch (err) { saveErr = err; }
      if (!saveErr) { history.unshift({ result: j.result, analyzed_at: nowISO, created_at: nowISO }); renderList(); showScanNote(); }
      else {
        const w = document.createElement("div"); w.className = "card rfull";
        w.style.cssText = "border-color:#e7c98a;background:#fbf3df;color:#8a6d1a;font-size:13px;font-weight:600";
        w.innerHTML = '<svg class="emi" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ' + L({ en: "Result is shown but couldn't be saved to your account (network issue). Please re-upload when your connection is stable so it persists after refresh.", id: "Hasil tampil tapi belum tersimpan ke akunmu (masalah jaringan). Coba upload ulang saat koneksi stabil biar tetap ada setelah refresh." });
        if (resultBox) resultBox.prepend(w);
      }
    } catch (err) {
      const msg = (err && err.name === "AbortError") ? L({ en: "Took too long — please try again.", id: "Terlalu lama — coba lagi ya." }) :
        /fetch/i.test(err.message || "") ? L({ en: "Connection failed. Check internet & try again.", id: "Koneksi gagal. Cek internet & coba lagi." }) : err.message;
      resultBox.innerHTML = '<div class="card" style="color:var(--red)">' + msg + "</div>";
    }
    fileInput.value = "";
  }

  // ---- Translation plumbing (ported verbatim; numbers/params always from source) ----
  let currentRes = null, baseRes = null, transCache = {}, curId = null, showOriginal = false, mainFailed = false;
  const T_DISCLAIMER = { en: "Translation assisted by AI. Numbers & lab values are unchanged.", id: "Terjemahan dibantu AI. Angka & hasil lab tidak diubah." };
  const T_UNAVAIL = { en: "Translation unavailable — showing the original.", id: "Terjemahan belum tersedia — menampilkan versi asli." };
  const T_VIEWORIG = { en: "View original", id: "Lihat versi asli" };
  const T_VIEWTRANS = { en: "View translation", id: "Lihat terjemahan" };
  function srcLang(res) { return (res && res._lang) || "en"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  function mergeTrans(base, tr) {
    if (!tr || typeof tr !== "object") return base;
    let out; try { out = JSON.parse(JSON.stringify(base || {})); } catch (e) { return base; }
    if (typeof tr.summary === "string") out.summary = tr.summary;
    if (typeof tr.disclaimer === "string") out.disclaimer = tr.disclaimer;
    if (Array.isArray(tr.eating_plan)) out.eating_plan = tr.eating_plan;
    if (Array.isArray(tr.exercise_plan)) out.exercise_plan = tr.exercise_plan;
    if (Array.isArray(tr.unreadable)) out.unreadable = tr.unreadable;
    if (Array.isArray(out.parameters) && Array.isArray(tr.parameters)) {
      out.parameters.forEach((p, i) => { const tp = tr.parameters[i]; if (tp && typeof tp.explanation === "string") p.explanation = tp.explanation; });
    }
    if (Array.isArray(out.abnormal_findings) && Array.isArray(tr.abnormal_findings)) {
      out.abnormal_findings.forEach((f, i) => { const tf = tr.abnormal_findings[i]; if (tf) { if (typeof tf.why_it_matters === "string") f.why_it_matters = tf.why_it_matters; if (typeof tf.what_to_do === "string") f.what_to_do = tf.what_to_do; } });
    }
    return out;
  }
  // CSP-safe translation banner: data-act hooks instead of inline onclick.
  function tbannerHTML(scope, warn, text, mode, linkLabel) {
    return '<div class="tbanner' + (warn ? " warn" : "") + '"><span>' + esc(text) + "</span>" +
      (mode ? '<button type="button" class="tlink" data-act="tview" data-scope="' + scope + '" data-mode="' + mode + '">' + esc(linkLabel) + "</button>" : "") + "</div>";
  }
  function seedCache(cache, res) {
    cache[srcLang(res)] = res;
    if (res._alt && res._alt._lang) { const ma = mergeTrans(res, res._alt); ma._lang = res._alt._lang; cache[res._alt._lang] = ma; }
    if (res.i18n) { for (const k in res.i18n) { if (res.i18n[k]) { const mk = mergeTrans(res, res.i18n[k]); mk._lang = k; cache[k] = mk; } } }
    return cache;
  }
  async function persistTrans(id, base, lang, res) {
    if (id == null || !base) return;
    try { base.i18n = base.i18n || {}; base.i18n[lang] = res; await supabase.from("my20fit_mcu_result").update({ result: base }).eq("id", id); } catch (e) {}
  }

  function showResult(res, noScroll, id) {
    baseRes = res; transCache = {}; showOriginal = false; mainFailed = false;
    curId = (id != null) ? id : null;
    seedCache(transCache, res);
    translateMain(noScroll);
  }
  function renderMain(noScroll) {
    const base = baseRes; if (!base || !resultBox) return;
    const src = srcLang(base), want = LANG;
    let res, banner = "";
    if (want === src) { res = base; }
    else if (mainFailed) { res = base; banner = tbannerHTML("main", true, L(T_UNAVAIL)); }
    else if (showOriginal) { res = base; banner = tbannerHTML("main", false, L(T_DISCLAIMER), "trans", L(T_VIEWTRANS)); }
    else if (transCache[want]) { res = transCache[want]; banner = tbannerHTML("main", false, L(T_DISCLAIMER), "orig", L(T_VIEWORIG)); }
    else { res = base; }
    currentRes = res;
    resultBox.innerHTML = banner + render(res);
    if (!noScroll) resultBox.scrollIntoView({ behavior: "smooth" });
  }
  async function translateMain(noScroll) {
    const base = baseRes; if (!base) return;
    const src = srcLang(base), want = LANG;
    mainFailed = false;
    if (want === src || transCache[want]) { renderMain(noScroll); return; }
    renderMain(noScroll);
    const res = await aiTranslate(want, base);
    if (LANG !== want || baseRes !== base) return;
    if (res) { const m = mergeTrans(base, res); m._lang = want; transCache[want] = m; persistTrans(curId, base, want, m); renderMain(true); }
    else { mainFailed = true; renderMain(true); }
  }

  // ---- History ----
  async function loadHistory() {
    try { const { data, error } = await supabase.from("my20fit_mcu_result").select("*").eq("auth_user_id", user.id).order("created_at", { ascending: false }).limit(100); if (error) throw error; history = data || []; }
    catch (e) { history = []; }
  }
  function renderList() {
    if (toggleLabel) toggleLabel.textContent = L({ en: "All medical check-ups", id: "Semua hasil MCU" }) + " (" + history.length + ")";
    if (!listEl) return;
    if (!history.length) { listEl.innerHTML = '<div class="empty">' + L({ en: "No MCU results yet. Upload your check-up above.", id: "Belum ada hasil MCU. Upload hasil check-up kamu di atas." }) + "</div>"; return; }
    listEl.innerHTML = history.map((r, i) => {
      const res = r.result || {}; const date = (r.analyzed_at || r.created_at || "").slice(0, 10); const flag = (res.abnormal_findings || []).length;
      return '<div class="rec" data-act="open-history" data-i="' + i + '"><div class="grade"><svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:none;stroke:var(--red);stroke-width:2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><div style="flex:1"><div style="font-weight:700">' + esc(res.document_type || L({ en: "MCU Result", id: "Hasil MCU" })) + '</div><div class="muted">' + date + (flag ? " · " + flag + " " + L({ en: "need attention", id: "perlu perhatian" }) : "") + '</div></div><span class="seemore">' + L({ en: "See more", id: "Lihat detail" }) + " ›</span></div>";
    }).join("");
  }
  function toggleAllMcu() {
    const tg = q("#mcuToggle"); if (!listEl || !tg) return;
    const willOpen = listEl.style.display === "none";
    listEl.style.display = willOpen ? "" : "none";
    tg.classList.toggle("open", willOpen);
    tg.setAttribute("aria-expanded", willOpen ? "true" : "false");
  }
  function openAllMcu() {
    const tg = q("#mcuToggle");
    if (listEl) listEl.style.display = "";
    if (tg) { tg.classList.add("open"); tg.setAttribute("aria-expanded", "true"); }
    const card = q("#mcuHistoryCard"); if (card) card.scrollIntoView({ behavior: "smooth" });
  }
  function showScanNote() {
    const n = q("#mcuScanNote"); if (!n) return;
    n.innerHTML = '<svg class="emi" viewBox="0 0 24 24" style="stroke:#1d6b41"><path d="M20 6L9 17l-5-5"/></svg>' +
      '<span style="flex:1">' + L({ en: "Your medical check-up has been scanned — see more of your results", id: "Medical check-up kamu sudah discan — lihat hasil lengkapmu" }) + "</span>" +
      '<span style="font-weight:800">›</span>';
    n.style.display = "";
  }

  // ---- History detail modal (mirrors the main pane; own cache + persist) ----
  let mBase = null, mCache = {}, mOriginal = false, mFailed = false, mId = null, mDate = "";
  function isModalOpen() { return !!(modalBg && modalBg.classList.contains("open")); }
  function modalTitle(res) { if (modalTitleEl) modalTitleEl.textContent = ((res && res.document_type) || L({ en: "MCU Result", id: "Hasil MCU" })) + (mDate ? " · " + mDate : ""); }
  function openHistory(i) {
    const r = history[i]; if (!r || !r.result) return;
    mBase = r.result; mCache = {}; mOriginal = false; mFailed = false; mId = (r.id != null) ? r.id : null;
    mDate = (r.analyzed_at || r.created_at || "").slice(0, 10);
    seedCache(mCache, mBase); modalTitle(mBase);
    modalBg.classList.add("open"); modalBg.scrollTop = 0; document.body.style.overflow = "hidden";
    translateModal();
  }
  function renderModalBody() {
    const base = mBase; if (!base || !modalBodyEl) return;
    const src = srcLang(base), want = LANG;
    let res, banner = "";
    if (want === src) { res = base; }
    else if (mFailed) { res = base; banner = tbannerHTML("modal", true, L(T_UNAVAIL)); }
    else if (mOriginal) { res = base; banner = tbannerHTML("modal", false, L(T_DISCLAIMER), "trans", L(T_VIEWTRANS)); }
    else if (mCache[want]) { res = mCache[want]; banner = tbannerHTML("modal", false, L(T_DISCLAIMER), "orig", L(T_VIEWORIG)); }
    else { res = base; }
    modalTitle(res);
    modalBodyEl.innerHTML = banner + render(res);
  }
  async function translateModal() {
    const base = mBase; if (!base) return;
    const src = srcLang(base), want = LANG;
    mFailed = false;
    if (want === src || mCache[want]) { renderModalBody(); return; }
    renderModalBody();
    const res = await aiTranslate(want, base);
    if (!isModalOpen() || mBase !== base || LANG !== want) return;
    if (res) { const m = mergeTrans(base, res); m._lang = want; mCache[want] = m; persistTrans(mId, base, want, m); renderModalBody(); }
    else { mFailed = true; renderModalBody(); }
  }
  function closeMcuModal() { if (modalBg) modalBg.classList.remove("open"); document.body.style.overflow = ""; }

  async function aiTranslate(lang, data) {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 45000);
    try {
      const tk = await token();
      const r = await fetch("/api/translate", { method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json", Authorization: "Bearer " + (tk || "") }, body: JSON.stringify({ lang: lang, data: data }) });
      clearTimeout(to);
      const j = await r.json().catch(() => null);
      return (r.ok && j && j.result) ? j.result : null;
    } catch (e) { clearTimeout(to); return null; }
  }

  // ---- One delegated click listener (CSP-safe replacement for inline onclick) ----
  root.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-act]"); if (!el || !root.contains(el)) return;
    const act = el.getAttribute("data-act");
    if (act === "pick-file") { fileInput.click(); }
    else if (act === "toggle-all") { toggleAllMcu(); }
    else if (act === "open-all") { openAllMcu(); }
    else if (act === "close-modal") { closeMcuModal(); }
    else if (act === "open-history") { openHistory(Number(el.getAttribute("data-i"))); }
    else if (act === "tview") {
      const scope = el.getAttribute("data-scope"), mode = el.getAttribute("data-mode");
      if (scope === "main") { showOriginal = (mode === "orig"); renderMain(true); }
      else { mOriginal = (mode === "orig"); renderModalBody(); }
    }
  });
  fileInput.addEventListener("change", () => analyzeMCU(fileInput.files[0]));
  if (modalBg) modalBg.addEventListener("click", (e) => { if (e.target === modalBg) closeMcuModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMcuModal(); });

  // ---- Boot: member gate + initial load ----
  (async function () {
    let session = null;
    try { const { data } = await supabase.auth.getSession(); session = data && data.session; } catch (e) {}
    if (!session || !session.user) { location.replace(LANG === "id" ? "/id" : "/"); return; } // guest → landing
    user = session.user;
    await loadProfile();
    if (listEl) listEl.innerHTML = '<div class="empty">' + L({ en: "Loading your history…", id: "Memuat riwayat…" }) + "</div>";
    await loadHistory(); renderList();
    // After refresh: auto-show the newest saved result (like my.20fit.id/medical).
    if (history[0] && history[0].result) { showResult(history[0].result, true, history[0].id); }
    // Deep link from the old /scan/:id route (now redirected here as #scan=<id>):
    // open that scan's detail modal if it's one of the member's own rows.
    const dm = /#scan=([^&]+)/.exec(location.hash || "");
    if (dm) {
      const wantId = decodeURIComponent(dm[1]);
      const idx = history.findIndex((r) => String(r.id) === wantId);
      if (idx >= 0) openHistory(idx);
    }
  })();
}
