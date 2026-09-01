// Home page composition (server-rendered). Dependency-free ESM.

import { escapeHtml } from "../shared/escape.js";
import { getStrings } from "../shared/i18n.js";
import { buildLoginUrl } from "../shared/returnTo.js";

function heroSection(s) {
  return `<section class="hero">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <span class="badge-pill">${escapeHtml(s.heroBadge)}</span>
        <h1>${escapeHtml(s.heroTitle)}</h1>
        <p class="hero-sub">${escapeHtml(s.heroSubtitle)}</p>
        <div class="hero-cta">
          <a class="btn btn-primary" href="#upload">${escapeHtml(s.heroPrimaryCta)}</a>
          <a class="btn btn-ghost" href="#download">${escapeHtml(s.heroDownloadCta)}</a>
        </div>
        <div class="app-badges">
          <span class="app-badge">${escapeHtml(s.appStoreLine1)}<strong>${escapeHtml(s.appStoreLine2)}</strong></span>
          <span class="app-badge">${escapeHtml(s.playStoreLine1)}<strong>${escapeHtml(s.playStoreLine2)}</strong></span>
        </div>
        <div class="social-proof">
          <span class="avatar-stack" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
          <span class="social-proof-text">${escapeHtml(s.socialProofText)}</span>
        </div>
        <p class="hero-note">${escapeHtml(s.heroNote)}</p>
      </div>
      <div class="hero-media">
        <a class="hero-scan-cta" href="#upload">
          <span class="hero-scan-cta-icon" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2"></path><line x1="4" y1="12" x2="20" y2="12"></line></svg>
          </span>
          <span class="hero-scan-cta-title">${escapeHtml(s.heroScanCta)}</span>
          <span class="hero-scan-cta-hint">${escapeHtml(s.heroMediaCaption)}</span>
        </a>
      </div>
    </div>
    <div class="wrap">
      <div class="disclaimer-banner">${escapeHtml(s.heroDisclaimer)}</div>
    </div>
  </section>`;
}

/**
 * Universal upload widget — server-rendered for EVERYONE (anon + member).
 * Anonymous visitors can upload and get a fully open, one-time analysis
 * (no login gate on the upload/analyze action itself), but the result is
 * never persisted for them (no history row is possible without an account)
 * and a consent checkbox must be ticked before the analyze button enables —
 * client-side gate for calling the AI on someone's health document without
 * an account. Logged-in members get the same widget plus history/signed-in
 * UI, revealed by the client once a session is confirmed.
 */
function uploadSection(s, loginUrl, returnToUrl) {
  const loginHref = buildLoginUrl(loginUrl, returnToUrl);
  return `<section id="upload" class="section">
    <div class="wrap">
      <h2>${escapeHtml(s.uploadHeading)}</h2>
      <hr class="rule">
      <div
        id="member-app"
        data-return-to="${escapeHtml(returnToUrl)}"
        data-login-base="${escapeHtml(loginUrl)}"
        data-login-href="${escapeHtml(loginHref)}"
      >
        <div class="member-signedin" data-role="signedin" hidden>
          <span class="member-who">${escapeHtml(s.signedInAs)}: <strong data-role="who"></strong></span>
          <button class="btn btn-ghost" data-act="signout" type="button">${escapeHtml(s.signOut)}</button>
        </div>

        <div class="upload-card" data-role="dropzone">
          <div class="upload-plus" aria-hidden="true">+</div>
          <div class="upload-title">${escapeHtml(s.uploadCardTitle)}</div>
          <div class="upload-hint">${escapeHtml(s.uploadCardHint)}</div>
          <input type="file" accept="image/jpeg,image/png,application/pdf" hidden data-role="file">
          <div class="file-name" data-role="filename" hidden></div>
          <div class="upload-actions">
            <button class="btn btn-ghost" data-act="choose" type="button">${escapeHtml(s.uploadCta)}</button>
          </div>
        </div>

        <div class="consent-row" data-role="consent-row">
          <input type="checkbox" id="mcu-consent" data-role="consent">
          <label for="mcu-consent">${escapeHtml(s.consentLabel)}</label>
        </div>

        <div class="member-actions">
          <button class="btn btn-primary btn-block" data-act="analyze" type="button" disabled>${escapeHtml(s.analyzeButton)}</button>
        </div>
        <span class="status-msg" data-role="status" role="status" aria-live="polite"></span>

        <div class="result-slot" data-role="result-slot" hidden>
          <div data-role="result-body"></div>
        </div>

        <div class="history" data-role="history-wrap" hidden>
          <h3>${escapeHtml(s.historyHeading)}</h3>
          <div data-role="history"></div>
        </div>

        <p class="hero-note" data-role="anon-login-hint">
          <a data-role="login-cta" href="${escapeHtml(loginHref)}">${escapeHtml(s.loginCta)}</a>
        </p>
      </div>

      <div class="steps-grid">
        <div class="step-card"><div class="step-num">01</div><h3>${escapeHtml(s.step1Title)}</h3><p>${escapeHtml(s.step1Desc)}</p></div>
        <div class="step-card"><div class="step-num">02</div><h3>${escapeHtml(s.step2Title)}</h3><p>${escapeHtml(s.step2Desc)}</p></div>
        <div class="step-card"><div class="step-num">03</div><h3>${escapeHtml(s.step3Title)}</h3><p>${escapeHtml(s.step3Desc)}</p></div>
      </div>
    </div>
  </section>`;
}

/**
 * Testimonial slots are intentionally an honest empty state, not fabricated
 * reviews — do not replace testimonialsEmptyState with invented quotes.
 */
function testimonialsSection(s) {
  return `<section id="testimonials" class="section section-alt">
    <div class="wrap">
      <h2>${escapeHtml(s.testimonialsHeading)}</h2>
      <p class="section-intro">${escapeHtml(s.testimonialsEmptyState)}</p>
    </div>
  </section>`;
}

function ecosystemSection(s) {
  const colors = { K: "#d81f0f", M: "#1f8a4c", C: "#2952e3", "20": "#16170f" };
  const cards = s.ecosystemProducts
    .map((p) => {
      const bg = colors[p.code] || "#16170f";
      const tag = p.current ? "div" : "a";
      const hrefAttr = p.current ? "" : ` href="${escapeHtml(p.url)}"`;
      return `<${tag} class="ecosystem-card${p.current ? " current" : ""}"${hrefAttr}>
        <div class="ecosystem-icon" style="background:${bg}">${escapeHtml(p.code)}</div>
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.desc)}</p>
        <div class="ecosystem-url">${escapeHtml(p.url.replace(/^https?:\/\//, ""))}</div>
      </${tag}>`;
    })
    .join("");
  return `<section id="ecosystem" class="section section-alt">
    <div class="wrap">
      <h2>${escapeHtml(s.ecosystemHeading)}</h2>
      <p class="section-intro">${escapeHtml(s.ecosystemSubtitle)}</p>
      <div class="ecosystem-grid">${cards}</div>
    </div>
  </section>`;
}

function faqSection(s) {
  const items = s.faq
    .map((f) => `<div class="faq-item"><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`)
    .join("");
  return `<section id="faq" class="section">
    <div class="wrap">
      <h2>${escapeHtml(s.faqHeading)}</h2>
      <div class="faq-list">${items}</div>
    </div>
  </section>`;
}

function ctaBanner(s, myOrigin) {
  return `<div class="cta-banner" data-role="cta-banner">
    <div class="wrap cta-banner-inner">
      <p>${escapeHtml(s.ctaBannerText)}</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="${escapeHtml(myOrigin)}">${escapeHtml(s.ctaBannerButton)}</a>
        <a class="btn btn-ghost" id="download" href="#download">${escapeHtml(s.heroDownloadCta)}</a>
      </div>
    </div>
  </div>`;
}

/**
 * @returns {{ title:string, description:string, bodyHtml:string }}
 */
export function renderHomePage({ lang, publicOrigin, loginUrl, canonicalPath }) {
  const s = getStrings(lang);
  const returnToUrl = publicOrigin + canonicalPath;
  const myOrigin = loginUrl.replace(/\/login\/?$/, "");
  const bodyHtml = [
    heroSection(s),
    uploadSection(s, loginUrl, returnToUrl),
    testimonialsSection(s),
    ecosystemSection(s),
    faqSection(s),
    ctaBanner(s, myOrigin),
  ].join("\n");

  return { title: s.metaTitle, description: s.metaDescription, bodyHtml };
}
