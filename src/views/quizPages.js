// Quiz hub (/quiz, /id/quiz) + individual quiz wizard pages (/quiz/<slug>,
// /id/quiz/<slug>) for the CMS-driven health quizzes. Content (quiz list,
// questions) comes from the server-side quiz store (src/server/quizzes.js) —
// nothing here is hardcoded, matching the brief: "isi kuis diatur dari CMS."
// Dependency-free ESM.

import { escapeHtml } from "../shared/escape.js";
import { getStrings } from "../shared/i18n.js";
import { healthDisclaimer, doctorCta } from "../shared/health.js";

function quizHrefFor(lang, slug) {
  const base = lang === "id" ? "/id/quiz" : "/quiz";
  return slug ? `${base}/${encodeURIComponent(slug)}` : base;
}

function localizedText(row, field, lang) {
  return lang === "id" ? row[`${field}_id`] : row[`${field}_en`];
}

/**
 * @returns {{ title, description, bodyHtml }}
 */
export function renderQuizHubPage({ lang, quizzes, bookingUrl }) {
  const s = getStrings(lang);
  const cards = (quizzes || [])
    .map((q) => {
      const href = quizHrefFor(lang, q.slug);
      const title = localizedText(q, "title", lang);
      const desc = localizedText(q, "description", lang);
      const minutes = q.estimated_minutes || 2;
      const timeLabel = lang === "id" ? `~${minutes} menit` : `~${minutes} min`;
      return `<a class="quiz-choice" href="${escapeHtml(href)}">
        <span class="quiz-choice-time">${escapeHtml(timeLabel)}</span>
        <h3 class="quiz-choice-title">${escapeHtml(title)}</h3>
        <p class="quiz-choice-desc">${escapeHtml(desc)}</p>
        <span class="quiz-choice-cta" aria-hidden="true">→</span>
      </a>`;
    })
    .join("");
  const empty = `<p class="section-intro">${escapeHtml(s.quizHubEmpty)}</p>`;

  const bodyHtml = `<section class="section hub-intro">
    <div class="wrap wrap-narrow">
      <h1>${escapeHtml(s.quizHubHeading)}</h1>
      <p class="section-intro">${escapeHtml(s.quizHubIntro)}</p>
      <div class="disclaimer-banner">${escapeHtml(s.quizDisclaimer)}</div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="quiz-choice-grid">${cards || ""}</div>
      ${cards ? "" : empty}
    </div>
  </section>
  <section class="section section-alt">
    <div class="wrap wrap-narrow">
      ${healthDisclaimer(s)}
      ${doctorCta(s, bookingUrl)}
    </div>
  </section>`;

  return { title: `${s.quizHubHeading} — ${s.brand}`, description: s.quizHubIntro, bodyHtml };
}

/**
 * @param {object} opts
 * @param {string} opts.lang
 * @param {object} opts.quiz          from quizStore.getBySlug() — includes .questions
 * @param {string} opts.loginUrl
 * @param {string} opts.returnToUrl
 * @param {string} opts.bookingUrl
 * @returns {{ title, description, bodyHtml }}
 */
export function renderQuizPage({ lang, quiz, loginUrl, returnToUrl, bookingUrl }) {
  const s = getStrings(lang);
  const title = localizedText(quiz, "title", lang);
  const description = localizedText(quiz, "description", lang);

  // Only what the browser needs to RENDER the wizard — never outcomes/match_rules,
  // those are evaluated server-side only (see server/quizzes.js).
  const payload = {
    slug: quiz.slug,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      order: q.order,
      type: q.type,
      question_id: q.question_id,
      question_en: q.question_en,
      help_id: q.help_id,
      help_en: q.help_en,
      options: q.options,
      is_required: q.is_required,
    })),
  };

  const bodyHtml = `<section class="section hub-intro">
    <div class="wrap wrap-narrow">
      <h1>${escapeHtml(title)}</h1>
      <p class="section-intro">${escapeHtml(description)}</p>
      <div class="disclaimer-banner">${escapeHtml(s.quizDisclaimer)}</div>
    </div>
  </section>
  <section class="section">
    <div class="wrap wrap-narrow">
      <div
        id="quiz-wizard"
        data-role="quiz-wizard"
        data-slug="${escapeHtml(quiz.slug)}"
        data-quiz="${escapeHtml(JSON.stringify(payload))}"
        data-login-base="${escapeHtml(loginUrl)}"
        data-return-to="${escapeHtml(returnToUrl)}"
      >
        <div class="quiz-progress" data-role="qw-progress" hidden>
          <div class="quiz-progress-bar"><div class="quiz-progress-fill" data-role="qw-progress-fill"></div></div>
          <span class="quiz-progress-label" data-role="qw-progress-label"></span>
        </div>
        <form data-role="qw-form" novalidate>
          <div data-role="qw-question"></div>
          <div class="quiz-wizard-actions">
            <button type="button" class="btn btn-ghost" data-act="qw-back" hidden>${escapeHtml(s.quizBack)}</button>
            <button type="submit" class="btn btn-primary" data-act="qw-next">${escapeHtml(s.quizNext)}</button>
          </div>
        </form>
        <div class="quiz-result" data-role="qw-result" hidden></div>
      </div>
    </div>
  </section>
  <section class="section section-alt">
    <div class="wrap wrap-narrow">
      ${healthDisclaimer(s)}
      ${doctorCta(s, bookingUrl)}
    </div>
  </section>`;

  return { title: `${title} — ${s.brand}`, description, bodyHtml };
}
