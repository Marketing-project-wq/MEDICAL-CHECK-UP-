// Shared escalation UI for EVERY awareness/education tool on mcu.20fit.id
// (health articles now; BMI quiz, "health rate" calculator, program recos
// next). Two product non-negotiables live here so they can never drift
// between tools:
//   1) every tool states clearly it is EDUCATION / AWARENESS, not a formal
//      diagnosis; and
//   2) every tool offers the official escalation — "consult a 20FIT doctor" —
//      pointing at the in-app Book Doctor flow.
// Both take the already-localized strings object (getStrings(lang)) so copy
// stays in one place (i18n) and identical across tools.
// Dependency-free ESM.

import { escapeHtml } from "./escape.js";

export function healthDisclaimer(s) {
  return `<div class="health-disclaimer" role="note">
    <strong>${escapeHtml(s.healthDisclaimerTitle)}:</strong> ${escapeHtml(s.healthDisclaimerText)}
  </div>`;
}

/**
 * @param {object} s          getStrings(lang)
 * @param {string} bookingUrl the in-app Book Doctor URL (server config)
 */
export function doctorCta(s, bookingUrl) {
  const href = bookingUrl || "#";
  return `<aside class="doctor-cta">
    <div class="doctor-cta-body">
      <strong>${escapeHtml(s.doctorCtaTitle)}</strong>
      <p>${escapeHtml(s.doctorCtaText)}</p>
    </div>
    <a class="btn btn-primary" href="${escapeHtml(href)}">${escapeHtml(s.doctorCtaButton)}</a>
  </aside>`;
}
