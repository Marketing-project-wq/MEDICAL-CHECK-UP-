// Medical Record page — the faithful clone of my.20fit.id/medical
// (profile20fit/medical.html), rendered inside this app's standard layout so it
// keeps the shared header bar (Products mega-menu, language, dark mode, SSO).
//
// The markup mirrors medical.html one-to-one (hero, upload card, consult banner,
// #result, scan note, "All MCU" toggle, history #list, detail modal) with the
// SAME id/class hooks the ported renderer and controller expect. The only change
// from the source is CSP-safety: inline onclick="…" handlers become data-act="…"
// hooks wired by src/client/medical.js (this app serves a strict CSP with no
// inline event handlers). Everything is wrapped in .medrec so public/medical.css
// (the scoped port of medical.html's <style>) styles it exactly like the original.
//
// Static labels are baked in per-language server-side (the route is /medical for
// EN and /id/medical for ID); the dynamic result text is what the AI translate
// layer swaps at runtime.

import { getStrings } from "../shared/i18n.js";
import { escapeHtml } from "../shared/escape.js";
import { CLINIC_WHATSAPP_URL } from "../shared/contact.js";

/**
 * @param {{ lang: "en"|"id" }} opts
 * @returns {{ title:string, description:string, bodyHtml:string }}
 */
export function renderMedicalPage({ lang }) {
  const s = getStrings(lang);
  const e = escapeHtml;

  const bodyHtml = `<div class="medrec" data-medrec data-lang="${lang}">
    <div class="wrap">
      <header class="hero">
        <div class="kick">${e(s.med_kick)}</div>
        <h1>${e(s.med_title)}</h1>
        <div class="muted">${e(s.med_sub)}</div>
      </header>

      <div class="card up" data-act="pick-file" role="button" tabindex="0" aria-label="${e(s.med_upload)}">
        <div class="ic"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></div>
        <div style="font-weight:800;font-size:16px;margin-top:2px">${e(s.med_upload)}</div>
        <div class="muted" style="margin:4px 12px 0;line-height:1.45">${e(s.med_uploadsub)}</div>
      </div>
      <input id="mcufile" type="file" accept="image/*,application/pdf" style="display:none" data-role="mcufile" />
      <input id="mcucam" type="file" accept="image/*" capture="environment" style="display:none" data-role="mcucam" />
      <div class="med-cam-row">
        <button type="button" class="med-cam" data-act="capture">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          ${e(lang === "id" ? "Ambil Foto Sekarang" : "Take a Photo Now")}
        </button>
      </div>

      <div class="consultbn">
        <div class="cbic"><svg viewBox="0 0 24 24"><path d="M11 2a2 2 0 0 0-2 2v1a2 2 0 0 0-2 2v3a6 6 0 0 0 12 0V7a2 2 0 0 0-2-2V4a2 2 0 0 0-2-2"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/></svg></div>
        <div style="flex:1">
          <div class="cbt">${e(s.med_consult_t)}</div>
          <div class="cbs">${e(s.med_consult_s)}</div>
        </div>
        <a class="cbbtn" href="${e(CLINIC_WHATSAPP_URL)}">${e(s.med_consult_cta)}</a>
      </div>

      <div id="result" data-role="result"></div>

      <div id="mcuScanNote" class="mcu-note" style="display:none" data-act="open-all"></div>

      <div class="card" id="mcuHistoryCard">
        <button type="button" id="mcuToggle" class="mcu-toggle" data-act="toggle-all" aria-expanded="false">
          <span id="mcuToggleLabel" data-role="toggle-label"></span>
          <svg class="mcu-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div id="list" class="mcu-list" data-role="list" style="display:none"></div>
      </div>
    </div>

    <div class="mcu-bg" id="mcuModalBg" data-role="modal-bg">
      <div class="mcu-modal">
        <div class="mcu-hd"><h3 id="mcuModalTitle" data-role="modal-title">—</h3><button class="x-close" data-act="close-modal" aria-label="${e(s.med_close)}"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="mcu-body" id="mcuModalBody" data-role="modal-body"></div>
      </div>
    </div>
  </div>`;

  return {
    title: `${s.med_title} · 20FIT`,
    description: s.med_sub,
    bodyHtml,
  };
}
