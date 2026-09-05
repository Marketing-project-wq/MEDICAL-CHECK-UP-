// Server-rendered HTML shell: SEO meta, header/footer/logo, config injection.
// Dependency-free ESM.

import { escapeHtml, escapeJsonForScript } from "../shared/escape.js";
import { LANG_STORAGE_KEY } from "../shared/langPref.js";
import { THEME_STORAGE_KEY } from "../shared/themePref.js";

// Runs synchronously, before the browser paints anything, so a returning
// visitor's stored language preference always wins over whatever the URL
// happens to be — the redirect happens before there is anything to flash.
// Must stay a plain classic (non-module) inline script: a `type="module"`
// script is deferred until after parsing, which would be too late here.
function langRedirectScript() {
  return `(function(){try{
    var stored = localStorage.getItem(${JSON.stringify(LANG_STORAGE_KEY)});
    if (!stored) return;
    var path = location.pathname;
    var isIdPath = path === "/id" || path.indexOf("/id/") === 0;
    var current = isIdPath ? "id" : "en";
    if (stored !== "en" && stored !== "id") return;
    if (stored === current) return;
    var rest = isIdPath ? (path.slice(3) || "/") : path;
    var target = stored === "id" ? ("/id" + (rest === "/" ? "" : rest)) : rest;
    location.replace(target + location.search + location.hash);
  }catch(e){}})();`;
}

// Runs synchronously, before the browser paints anything (placed first in
// <head>, before the stylesheet link), so the correct theme's colors are
// what actually gets painted — never a light flash before a dark switch.
// A stored explicit choice always wins; otherwise this follows the OS-level
// prefers-color-scheme, matching it live if the visitor later changes it
// at the OS level without ever having picked a theme here themselves.
function themeInitScript() {
  return `(function(){try{
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var theme = stored === "dark" || stored === "light" ? stored :
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  }catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;
}

// Two explicit EN/ID buttons (not a dropdown, not one button that swaps
// label) — the active one is visually distinct (.is-active) AND carries
// aria-pressed for screen readers/keyboard users. Real <button> elements:
// both are always present and focusable, keyboard-operable natively
// (Enter/Space), no href/navigation involved — switching is handled by the
// client-side applyLanguage() in app.js. Reused for both the header and
// the footer, and re-rendered by the client on every language switch, so
// the "active" state always matches whatever the client just picked.
function langToggleMarkup(lang, s) {
  return `<div class="lang-toggle" role="group" aria-label="${escapeHtml(s.langToggleAriaLabel)}">
    <button type="button" class="lang-btn${lang === "en" ? " is-active" : ""}" data-act="lang" data-lang="en" aria-pressed="${lang === "en" ? "true" : "false"}">EN</button>
    <button type="button" class="lang-btn${lang === "id" ? " is-active" : ""}" data-act="lang" data-lang="id" aria-pressed="${lang === "id" ? "true" : "false"}">ID</button>
  </div>`;
}

// Sits immediately after the header logo <img> + its text fallback in the
// HTML flow (see theme-logo markup below), reached via the shared .brand
// parent rather than a sibling index so it's resilient to markup order. If
// the image ever fails to load for any reason (asset missing, blocked,
// wrong path), the plain text mark takes over instead of the browser's
// oversized broken-image-plus-alt-text rendering.
function themeLogoBootScript(logoLightUrl, logoDarkUrl) {
  return `(function(){try{
    var theme = document.documentElement.getAttribute("data-theme") || "light";
    var brand = document.currentScript.closest(".brand");
    var img = brand.querySelector(".brand-logo");
    var fallback = brand.querySelector(".brand-logo-fallback");
    img.onerror = function(){ img.hidden = true; fallback.hidden = false; };
    img.src = theme === "dark" ? ${JSON.stringify(logoDarkUrl)} : ${JSON.stringify(logoLightUrl)};
  }catch(e){}})();`;
}

/**
 * @param {object} opts
 * @param {string} opts.lang            "id" | "en"
 * @param {object} opts.strings         getStrings(lang)
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.canonicalPath   e.g. "/" (English, default) or "/id"
 * @param {string} opts.publicOrigin    e.g. https://medicalcheckup.20fit.id
 * @param {string} opts.bodyHtml
 * @param {object} opts.clientConfig    injected as window.__MCU_CONFIG__
 * @param {string} [opts.bodyClass]
 */
export function renderLayout(opts) {
  const {
    lang,
    strings: s,
    title,
    description,
    canonicalPath,
    publicOrigin,
    bodyHtml,
    clientConfig,
    nonce,
    bodyClass = "",
    logoLightUrl,
    logoDarkUrl,
    canonicalOverride = null,
    suppressAlternates = false,
  } = opts;

  // Article detail pages pass canonicalOverride = the media.20fit published_url
  // so mcu shows the content without competing with media.20fit for SEO;
  // suppressAlternates drops the home-page hreflang links that don't apply
  // off the home route.
  const canonical = canonicalOverride || publicOrigin + canonicalPath;
  const altId = publicOrigin + "/id";
  const altEn = publicOrigin + "/";
  const myOrigin = clientConfig.apiBase;
  const homeHref = lang === "id" ? "/id" : "/";
  const checkMcuHref = lang === "id" ? "/id/check-mcu" : "/check-mcu";
  const articlesHref = lang === "id" ? "/id/articles" : "/articles";

  return `<!doctype html>
<html lang="${escapeHtml(s.htmlLang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script nonce="${escapeHtml(nonce)}">${themeInitScript()}</script>
<script nonce="${escapeHtml(nonce)}">${langRedirectScript()}</script>
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
${suppressAlternates ? "" : `<link rel="alternate" hreflang="id" href="${escapeHtml(altId)}">
<link rel="alternate" hreflang="en" href="${escapeHtml(altEn)}">
<link rel="alternate" hreflang="x-default" href="${escapeHtml(altEn)}">`}
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<link rel="preload" as="image" href="${escapeHtml(logoLightUrl)}">
<link rel="preload" as="image" href="${escapeHtml(logoDarkUrl)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta name="robots" content="index,follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<script nonce="${escapeHtml(nonce)}">window.__MCU_CONFIG__ = ${escapeJsonForScript(clientConfig)};</script>
</head>
<body class="${escapeHtml(bodyClass)}">
<a class="skip-link" href="#main">${escapeHtml(s.skipToContent)}</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${escapeHtml(myOrigin)}" aria-label="20FIT">
      <img class="brand-logo" alt="20FIT" width="112" height="32">
      <span class="brand-logo-fallback" hidden>20FIT</span>
      <script nonce="${escapeHtml(nonce)}">${themeLogoBootScript(logoLightUrl, logoDarkUrl)}</script>
      <span class="brand-sub">${escapeHtml(s.headerTagline)}</span>
    </a>
    <nav class="site-nav" aria-label="primary">
      <a href="${escapeHtml(homeHref)}" class="nav-secondary">${escapeHtml(s.nav.beranda)}</a>
      <a href="${escapeHtml(articlesHref)}" class="nav-secondary">${escapeHtml(s.nav.articles)}</a>
      <a href="${escapeHtml(homeHref)}#faq" class="nav-secondary">${escapeHtml(s.nav.example)}</a>
      <a href="${escapeHtml(checkMcuHref)}" class="nav-cta">${escapeHtml(s.nav.home)}</a>
      ${langToggleMarkup(lang, s)}
      <button type="button" class="theme-toggle" data-act="theme-toggle" aria-label="${escapeHtml(s.themeToggleLabel)}">
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7"></path></svg>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.4 14.7A8.6 8.6 0 1 1 9.3 3.6a7 7 0 0 0 11.1 11.1Z"></path></svg>
      </button>
    </nav>
  </div>
</header>
<main id="main">
${bodyHtml}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <span class="brand-mark">20FIT</span>
        <p>${escapeHtml(s.footerTagline)}</p>
      </div>
      <div class="footer-col">
        <h4>${escapeHtml(s.footerColApp)}</h4>
        <ul>
          <li><a href="https://calories.20fit.id">${escapeHtml(s.ecosystemProducts[0].name)}</a></li>
          <li><a href="https://menu.20fit.id">${escapeHtml(s.ecosystemProducts[1].name)}</a></li>
          <li><a href="${escapeHtml(publicOrigin)}">${escapeHtml(s.ecosystemProducts[2].name)}</a></li>
          <li><a href="${escapeHtml(myOrigin)}">${escapeHtml(s.ecosystemProducts[3].name)}</a></li>
          <li><a href="${escapeHtml(articlesHref)}">${escapeHtml(s.nav.articles)}</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>${escapeHtml(s.footerColBrand)}</h4>
        <ul>
          <li>${escapeHtml(s.footerAbout)}</li>
          <li>${escapeHtml(s.footerStudioLocations)}</li>
          <li>${escapeHtml(s.footerContact)}</li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>${escapeHtml(s.footerColLegal)}</h4>
        <ul>
          <li>${escapeHtml(s.footerPrivacy)}</li>
          <li>${escapeHtml(s.footerTerms)}</li>
          <li>${escapeHtml(s.footerHealthData)}</li>
        </ul>
      </div>
    </div>
    <p class="footer-disclaimer">${escapeHtml(s.footerDisclaimer)}</p>
    <div class="footer-links">${langToggleMarkup(lang, s)}</div>
    <p class="footer-copy">© ${new Date().getFullYear()} 20FIT Sport Clinic Indonesia</p>
  </div>
</footer>
<script type="module" src="/client/app.js"></script>
</body>
</html>`;
}
