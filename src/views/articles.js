// Server-rendered article list + detail pages (Tahap 1). Every page carries
// the shared health disclaimer and the "consult a 20FIT doctor" escalation, so
// educational content always points to the real clinical service. The detail
// page returns `canonical` = the media.20fit published_url so mcu shows the
// article without cannibalizing media.20fit's SEO. Dependency-free ESM.

import { escapeHtml } from "../shared/escape.js";
import { sanitizeArticleHtml } from "../shared/sanitizeHtml.js";
import { healthDisclaimer, doctorCta } from "../shared/health.js";
import { articleCover } from "../shared/articleCover.js";

function fmtDate(v, lang) {
  if (!v) return "";
  try {
    return new Date(v).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function articlePath(lang, slug) {
  const base = lang === "id" ? "/id/articles" : "/articles";
  return slug ? `${base}/${encodeURIComponent(slug)}` : base;
}

function metaRow(a, lang) {
  const cat = a.category ? `<span class="article-cat">${escapeHtml(a.category)}</span>` : "";
  const date = a.published_at ? `<span class="article-date">${escapeHtml(fmtDate(a.published_at, lang))}</span>` : "";
  return cat + date;
}

/** @returns {{title, description, bodyHtml}} */
export function articleListPage({ s, lang, articles }) {
  const rows = Array.isArray(articles) ? articles : [];
  const cards = rows
    .map((a) => {
      const desc = a.excerpt || a.meta_description || "";
      return `<a class="article-card" href="${escapeHtml(articlePath(lang, a.slug))}">
        ${articleCover(a)}
        <div class="article-card-body">
          <div class="article-card-meta">${metaRow(a, lang)}</div>
          <h2 class="article-card-title">${escapeHtml(a.title || "")}</h2>
          ${desc ? `<p class="article-card-excerpt">${escapeHtml(String(desc).slice(0, 160))}</p>` : ""}
          <span class="article-card-more">${escapeHtml(s.articleReadMore)} →</span>
        </div>
      </a>`;
    })
    .join("");

  const bodyHtml = `<section class="section">
    <div class="wrap">
      <h1>${escapeHtml(s.articlesHeading)}</h1>
      <p class="section-intro">${escapeHtml(s.articlesIntro)}</p>
      ${healthDisclaimer(s)}
      ${cards ? `<div class="article-grid">${cards}</div>` : `<p class="section-intro">${escapeHtml(s.articlesEmpty)}</p>`}
    </div>
  </section>`;

  return { title: `${s.articlesHeading} — ${s.brand}`, description: s.articlesIntro, bodyHtml };
}

/** @returns {{title, description, bodyHtml, canonical}} */
export function articleDetailPage({ s, lang, article, bookingUrl }) {
  const a = article || {};
  const author = a.author_name ? `<span class="article-author">${escapeHtml(a.author_name)}</span>` : "";
  const source = a.published_url
    ? `<p class="article-source">${escapeHtml(s.articleSourcePrefix)}
        <a href="${escapeHtml(a.published_url)}" rel="noopener" target="_blank">media.20fit.id</a></p>`
    : "";

  const bodyHtml = `<article class="section article-detail">
    <div class="wrap wrap-narrow">
      <p class="article-back"><a href="${escapeHtml(articlePath(lang))}">${escapeHtml(s.articleBackToList)}</a></p>
      ${articleCover(a, { hero: true })}
      <div class="article-card-meta">${metaRow(a, lang)}${author}</div>
      <h1 class="article-title">${escapeHtml(a.title || "")}</h1>
      ${healthDisclaimer(s)}
      <div class="article-body">${sanitizeArticleHtml(a.body_html || "")}</div>
      ${source}
      ${doctorCta(s, bookingUrl)}
    </div>
  </article>`;

  return {
    title: `${a.meta_title || a.title || s.articlesHeading} — ${s.brand}`,
    description: a.meta_description || a.excerpt || s.articlesIntro,
    bodyHtml,
    canonical: a.published_url || null,
  };
}
