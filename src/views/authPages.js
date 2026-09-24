// Built-in auth pages for medicalscanner.20fit.id — /login, /register,
// /reset-password, /auth/callback. Server-rendered shells; the browser module
// src/client/auth.js hydrates the forms and drives supabase-js directly
// (signInWithPassword / signUp / signInWithOAuth / resetPasswordForEmail).
//
// The SAME Supabase project as my.20fit.id, so an account made here works
// across the whole 20FIT ecosystem, and a profile row is created by the shared
// DB trigger on auth.users — no profile-insert code needed here.
// Dependency-free ESM.

import { escapeHtml } from "../shared/escape.js";
import { getStrings } from "../shared/i18n.js";
import { safeNextPath } from "../shared/returnTo.js";

// Small inline Google "G" (brand SVG, not an emoji — spec: no emoji).
const GOOGLE_SVG = `<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z"/></svg>`;

// Login / register side graphic — supplied by the user, hotlinked from
// media.20fit.id (same host as the logo; already allowed by the CSP img-src).
// Desktop uses a wide shot; mobile (≤859px, where the panel stacks on top of
// the form) swaps to a portrait shot via <picture>. If either image fails to
// load, the panel falls back to a solid brand-red background and the white copy
// stays legible. Override here if the source files ever move.
const AUTH_SIDE_IMG_DESKTOP = "https://media.20fit.id/wp-content/uploads/2026/09/WhatsApp-Image-2026-07-31-at-16.45.06-2.jpeg";
const AUTH_SIDE_IMG_MOBILE = "https://media.20fit.id/wp-content/uploads/2026/09/WhatsApp-Image-2026-07-31-at-15.04.33-3.jpeg";

// The product panel beside the auth form. All copy is white over a dark scrim
// so it reads over any photo; the text itself is truthful product framing
// (awareness, not diagnosis), never an invented claim.
function authAside(a) {
  return `<aside class="auth-aside">
    <picture class="auth-aside-pic">
      <source media="(max-width: 859px)" srcset="${escapeHtml(AUTH_SIDE_IMG_MOBILE)}">
      <img class="auth-aside-img" src="${escapeHtml(AUTH_SIDE_IMG_DESKTOP)}" alt="" loading="lazy" decoding="async">
    </picture>
    <div class="auth-aside-inner">
      <div class="auth-aside-brand">20FIT</div>
      <h2 class="auth-aside-title">${escapeHtml(a.sideTitle)}</h2>
      <p class="auth-aside-desc">${escapeHtml(a.sideDesc)}</p>
    </div>
  </aside>`;
}

// `aside` (optional): the product graphic panel. When present the shell renders
// a two-panel card (image beside the form on desktop, stacked on mobile); when
// omitted it's the plain centered card (reset-password, callback).
function authShell(dataAttrs, inner, aside = "") {
  return `<section class="section auth-section"><div class="wrap">
    <div class="auth-layout${aside ? " has-side" : ""}">
      ${aside}
      <div class="auth-card" ${dataAttrs}>
        ${inner}
      </div>
    </div>
  </div></section>`;
}

function field(id, label, type, placeholder, extra = "") {
  return `<div class="auth-field">
    <label class="auth-label" for="${id}">${escapeHtml(label)}</label>
    <input class="auth-input" id="${id}" data-role="${id}" type="${type}" placeholder="${escapeHtml(placeholder)}" autocomplete="${type === "password" ? "current-password" : "off"}" ${extra}>
  </div>`;
}

function statusArea() {
  return `<div class="auth-error" data-role="error" role="alert" hidden></div>
    <div class="auth-note" data-role="note" role="status" hidden></div>`;
}

function googleBlock(a) {
  return `<button type="button" class="btn btn-ghost btn-block auth-google" data-act="google">${GOOGLE_SVG}<span>${escapeHtml(a.googleBtn)}</span></button>
    <div class="auth-divider"><span>${escapeHtml(a.or)}</span></div>`;
}

/** @param {"id"|"en"} lang @param {string} rawNext internal path to return to after auth */
export function renderLoginPage({ lang, next }) {
  const s = getStrings(lang);
  const a = s.auth;
  const nextPath = safeNextPath(next, "");
  const regHref = (lang === "id" ? "/id/register" : "/register") + (nextPath ? `?next=${encodeURIComponent(nextPath)}` : "");
  const resetHref = lang === "id" ? "/id/reset-password" : "/reset-password";
  const body = authShell(`data-auth-page="login" data-next="${escapeHtml(nextPath)}"`, `
    <h1 class="auth-title">${escapeHtml(a.loginTitle)}</h1>
    <p class="auth-desc">${escapeHtml(a.loginDesc)}</p>
    ${googleBlock(a)}
    <form data-role="form" method="post" novalidate>
      ${field("email", a.emailLabel, "email", a.emailPh, 'autocomplete="email" inputmode="email"')}
      ${field("password", a.passwordLabel, "password", a.passwordPh)}
      ${statusArea()}
      <button type="submit" class="btn btn-primary btn-block" data-act="submit">${escapeHtml(a.loginSubmit)}</button>
    </form>
    <div class="auth-links">
      <a href="${escapeHtml(resetHref)}">${escapeHtml(a.forgot)}</a>
      <a href="${escapeHtml(regHref)}">${escapeHtml(a.toRegister)}</a>
    </div>
    <p class="auth-brandnote">${escapeHtml(a.brandNote)}</p>
  `, authAside(a));
  return { title: `${a.loginTitle} — ${s.brand}`, description: a.loginDesc, bodyHtml: body };
}

export function renderRegisterPage({ lang, next }) {
  const s = getStrings(lang);
  const a = s.auth;
  const nextPath = safeNextPath(next, "");
  const loginHref = (lang === "id" ? "/id/login" : "/login") + (nextPath ? `?next=${encodeURIComponent(nextPath)}` : "");
  const body = authShell(`data-auth-page="register" data-next="${escapeHtml(nextPath)}"`, `
    <h1 class="auth-title">${escapeHtml(a.registerTitle)}</h1>
    <p class="auth-desc">${escapeHtml(a.registerDesc)}</p>
    ${googleBlock(a)}
    <form data-role="form" method="post" novalidate>
      ${field("name", a.nameLabel, "text", a.namePh, 'autocomplete="name"')}
      ${field("email", a.emailLabel, "email", a.emailPh, 'autocomplete="email" inputmode="email"')}
      ${field("password", a.passwordLabel, "password", a.passwordPh, 'autocomplete="new-password" minlength="6"')}
      <label class="auth-consent">
        <input type="checkbox" data-role="consent">
        <span>${escapeHtml(a.consentLabel)}</span>
      </label>
      ${statusArea()}
      <button type="submit" class="btn btn-primary btn-block" data-act="submit">${escapeHtml(a.registerSubmit)}</button>
    </form>
    <div class="auth-links">
      <a href="${escapeHtml(loginHref)}">${escapeHtml(a.toLogin)}</a>
    </div>
    <p class="auth-brandnote">${escapeHtml(a.brandNote)}</p>
  `, authAside(a));
  return { title: `${a.registerTitle} — ${s.brand}`, description: a.registerDesc, bodyHtml: body };
}

export function renderResetPage({ lang }) {
  const s = getStrings(lang);
  const a = s.auth;
  const loginHref = lang === "id" ? "/id/login" : "/login";
  // Two states in one container; the client shows the new-password form only
  // when it detects a recovery token/session in the URL, otherwise the request
  // form. Both share one status area.
  const body = authShell(`data-auth-page="reset"`, `
    <div data-role="reset-request">
      <h1 class="auth-title">${escapeHtml(a.resetTitle)}</h1>
      <p class="auth-desc">${escapeHtml(a.resetDesc)}</p>
      <form data-role="form-request" method="post" novalidate>
        ${field("email", a.emailLabel, "email", a.emailPh, 'autocomplete="email" inputmode="email"')}
        <button type="submit" class="btn btn-primary btn-block" data-act="reset-request">${escapeHtml(a.resetSubmit)}</button>
      </form>
    </div>
    <div data-role="reset-newpass" hidden>
      <h1 class="auth-title">${escapeHtml(a.newPasswordTitle)}</h1>
      <p class="auth-desc">${escapeHtml(a.newPasswordDesc)}</p>
      <form data-role="form-newpass" method="post" novalidate>
        ${field("password", a.passwordLabel, "password", a.passwordPh, 'autocomplete="new-password" minlength="6"')}
        <button type="submit" class="btn btn-primary btn-block" data-act="reset-newpass">${escapeHtml(a.newPasswordSubmit)}</button>
      </form>
    </div>
    ${statusArea()}
    <div class="auth-links"><a href="${escapeHtml(loginHref)}">${escapeHtml(a.backToLogin)}</a></div>
  `);
  return { title: `${a.resetTitle} — ${s.brand}`, description: a.resetDesc, bodyHtml: body };
}

export function renderCallbackPage({ lang, next }) {
  const s = getStrings(lang);
  const a = s.auth;
  const nextPath = safeNextPath(next, "");
  const body = authShell(`data-auth-page="callback" data-next="${escapeHtml(nextPath)}"`, `
    <h1 class="auth-title">${escapeHtml(a.processing)}</h1>
    <p class="auth-desc"><span class="spinner"></span></p>
    ${statusArea()}
    <div class="auth-links"><a href="${escapeHtml(lang === "id" ? "/id/login" : "/login")}">${escapeHtml(a.backToLogin)}</a></div>
  `);
  return { title: `${a.processing} — ${s.brand}`, description: "", bodyHtml: body };
}
