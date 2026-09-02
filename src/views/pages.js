// Page composition (server-rendered). Two tiers:
//   Landing  (/, /id)      — marketing + education, CTA "enter" → the hub.
//   Home hub (/home, …)    — the app: three pillars (Scan MCU, Quiz, Articles),
//                            each with the shared disclaimer + doctor escalation.
// Dependency-free ESM.

import { escapeHtml } from "../shared/escape.js";
import { getStrings, getRenderLabels } from "../shared/i18n.js";
import { buildLoginUrl } from "../shared/returnTo.js";
import { renderResult } from "../shared/renderResult.js";
import { getSampleResult } from "../shared/sampleData.js";
import { healthDisclaimer, doctorCta } from "../shared/health.js";
import { articlePath } from "./articles.js";

function hubHrefFor(lang) {
  return lang === "id" ? "/id/home" : "/home";
}

// ── Landing sections ────────────────────────────────────────────────────────

function heroSection(s, hubHref) {
  return `<section class="hero">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <span class="badge-pill">${escapeHtml(s.heroBadge)}</span>
        <h1>${escapeHtml(s.heroTitle)}</h1>
        <p class="hero-sub">${escapeHtml(s.heroSubtitle)}</p>
        <div class="hero-cta">
          <a class="btn btn-primary" href="${escapeHtml(hubHref)}">${escapeHtml(s.heroPrimaryCta)}</a>
          <a class="btn btn-ghost" href="#example">${escapeHtml(s.heroSeeExample)}</a>
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
        <a class="hero-scan-cta" href="${escapeHtml(hubHref)}">
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
 * Fictional example result, shown to EVERYONE so a layperson can see what a
 * real analysis looks like without uploading anything — the §0.1-safe way to
 * preview the product. Rendered by the same renderResult() the real member
 * flow uses, and clearly badged as an example.
 */
function sampleSection(s, lang) {
  const t = getRenderLabels(lang);
  const resultHtml = renderResult(getSampleResult(lang), t);
  return `<section id="example" class="section section-alt">
    <div class="wrap">
      <div class="sample-head">
        <h2>${escapeHtml(s.sampleHeading)}</h2>
        <span class="sample-badge">${escapeHtml(s.sampleBadge)}</span>
      </div>
      <p class="section-intro">${escapeHtml(s.sampleNote)}</p>
      <div class="sample-result">${resultHtml}</div>
    </div>
  </section>`;
}

function howItWorksSection(s) {
  return `<section id="how" class="section">
    <div class="wrap">
      <h2>${escapeHtml(s.howHeading)}</h2>
      <div class="steps-grid">
        <div class="step-card"><div class="step-num">01</div><h3>${escapeHtml(s.step1Title)}</h3><p>${escapeHtml(s.step1Desc)}</p></div>
        <div class="step-card"><div class="step-num">02</div><h3>${escapeHtml(s.step2Title)}</h3><p>${escapeHtml(s.step2Desc)}</p></div>
        <div class="step-card"><div class="step-num">03</div><h3>${escapeHtml(s.step3Title)}</h3><p>${escapeHtml(s.step3Desc)}</p></div>
      </div>
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

function landingCta(s, hubHref) {
  return `<div class="cta-banner">
    <div class="wrap cta-banner-inner">
      <p>${escapeHtml(s.landingCtaText)}</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="${escapeHtml(hubHref)}">${escapeHtml(s.landingCtaButton)}</a>
      </div>
    </div>
  </div>`;
}

// ── Home hub sections ───────────────────────────────────────────────────────

function pillarNav(s) {
  const pillars = [
    { href: "#scan", icon: "🩺", title: s.pillarScanTitle, desc: s.pillarScanDesc },
    { href: "#quiz", icon: "❓", title: s.pillarQuizTitle, desc: s.pillarQuizDesc },
    { href: "#artikel", icon: "📰", title: s.pillarArticleTitle, desc: s.pillarArticleDesc },
  ];
  const cards = pillars
    .map(
      (p) => `<a class="pillar-card" href="${p.href}">
        <span class="pillar-icon" aria-hidden="true">${p.icon}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.desc)}</p>
      </a>`,
    )
    .join("");
  return `<section class="section hub-intro">
    <div class="wrap">
      <h1>${escapeHtml(s.hubHeading)}</h1>
      <p class="section-intro">${escapeHtml(s.hubIntro)}</p>
      <div class="pillar-grid">${cards}</div>
    </div>
  </section>`;
}

/**
 * Pillar 1 — Scan MCU. Spec §0.1: the gate is at UPLOAD, not at the result.
 * The uploader (file input, analyze, result, history) is MEMBER-ONLY and
 * rendered `hidden` by default; anonymous visitors (or before/without JS) get
 * only the login gate. Matches the server-side gate in scanHandlers.js.
 */
function scanSection(s, loginUrl, returnToUrl) {
  const loginHref = buildLoginUrl(loginUrl, returnToUrl);
  return `<section id="scan" class="section">
    <div class="wrap">
      <h2>${escapeHtml(s.memberHeading)}</h2>
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

        <div class="login-gate" data-role="login-gate">
          <p class="login-gate-intro">${escapeHtml(s.memberIntroAnon)}</p>
          <a class="btn btn-primary btn-block" data-role="login-cta" href="${escapeHtml(loginHref)}">${escapeHtml(s.loginCta)}</a>
        </div>

        <div class="uploader" data-role="uploader" hidden>
          <p class="uploader-intro">${escapeHtml(s.memberIntroMember)}</p>
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
        </div>
      </div>
    </div>
  </section>`;
}

// Quiz — BMI (+ optional waist-to-height). Pure client-side math on
// self-entered numbers (no upload, no AI, no server), so it is safe for anon
// and needs no §0.1 gate. The result is rendered by client/quiz.js; the copy
// (standard WHO thresholds + honest "BMI is a rough indicator" context + the
// doctor escalation) all lives in i18n.
function quizSection(s) {
  return `<section id="quiz" class="section section-alt">
    <div class="wrap wrap-narrow">
      <h2>${escapeHtml(s.pillarQuizTitle)}</h2>
      <p class="section-intro">${escapeHtml(s.quizIntro)}</p>
      <form class="quiz-form" data-role="quiz-form" novalidate>
        <div class="quiz-fields">
          <label class="quiz-field">
            <span>${escapeHtml(s.quizHeightLabel)}</span>
            <input type="number" inputmode="decimal" min="80" max="250" step="0.1" placeholder="170" data-role="q-height">
          </label>
          <label class="quiz-field">
            <span>${escapeHtml(s.quizWeightLabel)}</span>
            <input type="number" inputmode="decimal" min="25" max="400" step="0.1" placeholder="65" data-role="q-weight">
          </label>
          <label class="quiz-field">
            <span>${escapeHtml(s.quizWaistLabel)} <em>(${escapeHtml(s.quizOptional)})</em></span>
            <input type="number" inputmode="decimal" min="40" max="250" step="0.1" placeholder="80" data-role="q-waist">
          </label>
        </div>
        <button class="btn btn-primary" type="submit" data-role="q-submit">${escapeHtml(s.quizSubmit)}</button>
        <span class="status-msg" data-role="q-status" role="status" aria-live="polite"></span>
      </form>
      <div class="quiz-result" data-role="quiz-result" hidden></div>
    </div>
  </section>`;
}

function featuredArticlesSection(s, lang, articles) {
  const rows = Array.isArray(articles) ? articles.slice(0, 3) : [];
  const cards = rows
    .map((a) => {
      const desc = a.excerpt || a.meta_description || "";
      const cat = a.category ? `<span class="article-cat">${escapeHtml(a.category)}</span>` : "";
      return `<a class="article-card" href="${escapeHtml(articlePath(lang, a.slug))}">
        <div class="article-card-meta">${cat}</div>
        <h3 class="article-card-title">${escapeHtml(a.title || "")}</h3>
        ${desc ? `<p class="article-card-excerpt">${escapeHtml(String(desc).slice(0, 120))}</p>` : ""}
      </a>`;
    })
    .join("");
  return `<section id="artikel" class="section">
    <div class="wrap">
      <div class="section-head-row">
        <h2>${escapeHtml(s.articlesHeading)}</h2>
        <a class="link-more" href="${escapeHtml(articlePath(lang))}">${escapeHtml(s.viewAllArticles)} →</a>
      </div>
      ${cards ? `<div class="article-grid">${cards}</div>` : `<p class="section-intro">${escapeHtml(s.articlesEmpty)}</p>`}
    </div>
  </section>`;
}

function escalationSection(s, bookingUrl) {
  return `<section class="section section-alt">
    <div class="wrap wrap-narrow">
      ${healthDisclaimer(s)}
      ${doctorCta(s, bookingUrl)}
    </div>
  </section>`;
}

// ── Page composers ──────────────────────────────────────────────────────────

/** @returns {{ title:string, description:string, bodyHtml:string }} */
export function renderLandingPage({ lang, publicOrigin, loginUrl, canonicalPath }) {
  const s = getStrings(lang);
  const hubHref = hubHrefFor(lang);
  const bodyHtml = [
    heroSection(s, hubHref),
    sampleSection(s, lang),
    howItWorksSection(s),
    ecosystemSection(s),
    faqSection(s),
    testimonialsSection(s),
    landingCta(s, hubHref),
  ].join("\n");
  return { title: s.metaTitle, description: s.metaDescription, bodyHtml };
}

/** @returns {{ title:string, description:string, bodyHtml:string }} */
export function renderHomeHubPage({ lang, publicOrigin, loginUrl, canonicalPath, featuredArticles, bookingUrl }) {
  const s = getStrings(lang);
  const returnToUrl = publicOrigin + canonicalPath;
  const bodyHtml = [
    pillarNav(s),
    scanSection(s, loginUrl, returnToUrl),
    quizSection(s),
    featuredArticlesSection(s, lang, featuredArticles),
    escalationSection(s, bookingUrl),
  ].join("\n");
  return { title: s.hubMetaTitle, description: s.hubMetaDescription, bodyHtml };
}
