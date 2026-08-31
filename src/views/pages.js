// Home page composition (server-rendered). Dependency-free ESM.

import { escapeHtml } from "../shared/escape.js";
import { getStrings, getRenderLabels } from "../shared/i18n.js";
import { getMarkers } from "../shared/education.js";
import { getSample } from "../shared/sampleData.js";
import { renderResult } from "../shared/renderResult.js";
import { buildLoginUrl } from "../shared/returnTo.js";

function heroSection(s) {
  return `<section class="hero">
    <div class="wrap">
      <p class="kicker">${escapeHtml(s.heroKicker)}</p>
      <h1>${escapeHtml(s.heroTitle)}</h1>
      <p class="hero-sub">${escapeHtml(s.heroSubtitle)}</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="#analyze">${escapeHtml(s.heroPrimaryCta)}</a>
        <a class="btn btn-ghost" href="#example">${escapeHtml(s.heroSecondaryCta)}</a>
      </div>
      <p class="hero-note">${escapeHtml(s.heroNote)}</p>
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
