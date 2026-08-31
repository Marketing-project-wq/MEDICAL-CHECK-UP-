// Home page composition (server-rendered). Dependency-free ESM.

import { escapeHtml } from "../shared/escape.js";
import { getStrings, getRenderLabels } from "../shared/i18n.js";
import { getMarkers } from "../shared/education.js";
import { getSample } from "../shared/sampleData.js";
import { renderResult } from "../shared/renderResult.js";
import { buildLoginUrl } from "../shared/returnTo.js";

/**
 * Purely decorative "scan preview" mockup: illustrates the scan → result idea
 * on the hero without implying it is a real, already-analyzed document.
 * aria-hidden because it duplicates nothing informative (the real example
 * lives in #example, rendered by the shared renderResult renderer).
 */
function scanMockup(s) {
  return `<div class="scan-mock glass" aria-hidden="true">
    <p class="scan-mock-tag"><span class="dot"></span>${escapeHtml(s.scanMockTag)}</p>
    <div class="scan-mock-doc">
      <div class="scan-mock-beam"></div>
      <div class="scan-mock-line w80"></div>
      <div class="scan-mock-line w60"></div>
      <div class="scan-mock-row"><span>Kolesterol Total</span><span class="num flag">228 mg/dL ▲</span></div>
      <div class="scan-mock-row"><span>Gula Darah Puasa</span><span class="num flag">108 mg/dL ▲</span></div>
      <div class="scan-mock-row"><span>Tekanan Darah</span><span class="num">118/78</span></div>
      <div class="scan-mock-line w40"></div>
    </div>
  </div>`;
}

function heroSection(s) {
  const badges = s.trustBadges.map((b) => `<li>${escapeHtml(b)}</li>`).join("");
  return `<section class="hero">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="kicker">${escapeHtml(s.heroKicker)}</p>
        <h1>${escapeHtml(s.heroTitle)}</h1>
        <p class="hero-sub">${escapeHtml(s.heroSubtitle)}</p>
        <div class="hero-cta">
          <a class="btn btn-primary" href="#analyze">${escapeHtml(s.heroPrimaryCta)}</a>
          <a class="btn btn-ghost" href="#example">${escapeHtml(s.heroSecondaryCta)}</a>
        </div>
        <p class="hero-note">${escapeHtml(s.heroNote)}</p>
        <ul class="trust-badges">${badges}</ul>
      </div>
      ${scanMockup(s)}
    </div>
  </section>`;
}

function educationSection(s, markers) {
  const cards = markers
    .map(
      (m) => `<article class="edu-card">
        <h3>${escapeHtml(m.name)}</h3>
        <p class="edu-range"><span>${escapeHtml(s.rangeLabel)}:</span> ${escapeHtml(m.range)}</p>
        <p class="edu-meaning">${escapeHtml(m.meaning)}</p>
      </article>`,
    )
    .join("");
  return `<section id="education" class="section">
    <div class="wrap">
      <h2>${escapeHtml(s.eduHeading)}</h2>
      <p class="section-intro">${escapeHtml(s.eduIntro)}</p>
      <div class="edu-grid">${cards}</div>
    </div>
  </section>`;
}

function exampleSection(s, lang) {
  const sampleHtml = renderResult(getSample(lang), getRenderLabels(lang));
  return `<section id="example" class="section section-alt">
    <div class="wrap">
      <h2>${escapeHtml(s.exampleHeading)}</h2>
      <p class="section-intro">${escapeHtml(s.exampleIntro)}</p>
      <div class="sample-wrap">
        <div class="sample-badge">${escapeHtml(s.sampleBadge)}</div>
        ${sampleHtml}
      </div>
    </div>
  </section>`;
}

/**
 * Member/analyze area. The SERVER renders ONLY the anonymous view (login CTA,
 * no upload form) — spec §0.1 gates upload at the point of upload. The browser
 * client reveals the upload UI only when a session exists.
 */
function analyzeSection(s, loginUrl, returnToUrl) {
  const loginHref = buildLoginUrl(loginUrl, returnToUrl);
  return `<section id="analyze" class="section">
    <div class="wrap">
      <h2>${escapeHtml(s.memberHeading)}</h2>
      <div id="member-app" data-return-to="${escapeHtml(returnToUrl)}" data-login-base="${escapeHtml(loginUrl)}">
        <div class="member-anon" data-role="anon">
          <div class="anon-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="10" width="16" height="10" rx="2"></rect>
              <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
            </svg>
          </div>
          <p class="section-intro">${escapeHtml(s.memberIntroAnon)}</p>
          <a class="btn btn-primary" data-role="login-cta" href="${escapeHtml(loginHref)}">${escapeHtml(s.loginCta)}</a>
        </div>
        <!-- Member-only UI is injected here by the client after auth. -->
      </div>
    </div>
  </section>`;
}

/**
 * @returns {{ title:string, description:string, bodyHtml:string }}
 */
export function renderHomePage({ lang, publicOrigin, loginUrl, canonicalPath }) {
  const s = getStrings(lang);
  const returnToUrl = publicOrigin + canonicalPath;
  const bodyHtml = [
    heroSection(s),
    educationSection(s, getMarkers(lang)),
    exampleSection(s, lang),
    analyzeSection(s, loginUrl, returnToUrl),
  ].join("\n");

  return { title: s.metaTitle, description: s.metaDescription, bodyHtml };
}
