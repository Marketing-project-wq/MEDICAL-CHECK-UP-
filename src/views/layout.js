// Server-rendered HTML shell: SEO meta, header/footer/logo, config injection.
// Dependency-free ESM.

import { escapeHtml, escapeJsonForScript } from "../shared/escape.js";
import { LANG_STORAGE_KEY } from "../shared/langPref.js";

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
    var isEnPath = path === "/en" || path.indexOf("/en/") === 0;
    var current = isEnPath ? "en" : "id";
    if (stored !== "en" && stored !== "id") return;
    if (stored === current) return;
    var rest = isEnPath ? (path.slice(3) || "/") : path;
    var target = stored === "en" ? ("/en" + (rest === "/" ? "" : rest)) : rest;
    location.replace(target + location.search + location.hash);
  }catch(e){}})();`;
}

/**
 * @param {object} opts
 * @param {string} opts.lang            "id" | "en"
 * @param {object} opts.strings         getStrings(lang)
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.canonicalPath   e.g. "/" or "/en"
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
  } = opts;

  const canonical = publicOrigin + canonicalPath;
  const altId = publicOrigin + "/";
  const altEn = publicOrigin + "/en";
  const myOrigin = clientConfig.apiBase;

  return `<!doctype html>
<html lang="${escapeHtml(s.htmlLang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script nonce="${escapeHtml(nonce)}">${langRedirectScript()}</script>
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="alternate" hreflang="id" href="${escapeHtml(altId)}">
<link rel="alternate" hreflang="en" href="${escapeHtml(altEn)}">
<link rel="alternate" hreflang="x-default" href="${escapeHtml(altId)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
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
      <span class="brand-mark">20FIT</span>
      <span class="brand-sub">${escapeHtml(s.headerTagline)}</span>
    </a>
    <nav class="site-nav" aria-label="primary">
      <a href="#ecosystem" class="nav-secondary">${escapeHtml(s.nav.education)}</a>
      <a href="#faq" class="nav-secondary">${escapeHtml(s.nav.example)}</a>
      <a href="#upload" class="nav-cta">${escapeHtml(s.nav.analyze)}</a>
      <a class="lang-switch" href="${escapeHtml(s.otherLangHref)}" rel="alternate">${escapeHtml(s.otherLangLabel)}</a>
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
    <p class="footer-links">
      <a class="lang-switch" href="${escapeHtml(s.otherLangHref)}" rel="alternate">${escapeHtml(s.otherLangLabel)}</a>
    </p>
    <p class="footer-copy">© ${new Date().getFullYear()} 20FIT Sport Clinic Indonesia</p>
  </div>
</footer>
<script type="module" src="/client/app.js"></script>
</body>
</html>`;
}
