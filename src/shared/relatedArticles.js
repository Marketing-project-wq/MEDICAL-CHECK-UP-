// Map flagged MCU markers to nutrition_articles categories, and render the
// "related articles" cards. Pure + dependency-free so the logic is unit-tested
// and the client just feeds it rows it fetched (RLS-public, anon key).
//
// Honesty (spec "jangan ngarang"): the cards show REAL articles from
// nutrition_articles — no content is invented. Matching is by keyword in the
// marker label; if nothing matches, the caller falls back to general nutrition
// basics; if there are no articles, this renders nothing. Article links come
// from a server-configured URL template (no hardcoded/guessed path in code).

import { escapeHtml } from "./escape.js";

const KEYWORD_CATEGORIES = [
  { re: /(kolesterol|cholesterol|ldl|hdl|trigli|lipid)/i, cats: ["weight-management", "nutrition-basics"] },
  { re: /(gula|glukosa|glucose|hba1c|sugar)/i, cats: ["weight-management", "nutrition-basics"] },
  { re: /(tekanan darah|blood pressure|hipertensi|sodium|natrium)/i, cats: ["weight-management", "indonesian-food"] },
  { re: /(hemoglob|\bhb\b|zat besi|iron|ferritin|anemia)/i, cats: ["nutrition-basics"] },
  { re: /(asam urat|uric)/i, cats: ["nutrition-basics"] },
];

/**
 * Categories relevant to the flagged (high/low/warning) markers.
 * @param {Array<{label?:string,status?:string}>} metrics
 * @returns {string[]} ordered, de-duplicated category slugs (possibly empty)
 */
export function relatedCategories(metrics) {
  const flagged = (Array.isArray(metrics) ? metrics : []).filter(
    (m) => m && (m.status === "high" || m.status === "low" || m.status === "warning"),
  );
  const cats = [];
  for (const m of flagged) {
    for (const k of KEYWORD_CATEGORIES) {
      if (k.re.test(String(m.label || ""))) {
        for (const c of k.cats) if (!cats.includes(c)) cats.push(c);
      }
    }
  }
  return cats;
}

function localized(field, lang) {
  if (field && typeof field === "object") return field[lang] || field.id || field.en || "";
  return field == null ? "" : String(field);
}

function articleHref(template, slug) {
  const t = String(template || "");
  if (!t) return "";
  return t.includes("{slug}") ? t.replace("{slug}", encodeURIComponent(slug)) : t.replace(/\/?$/, "/") + encodeURIComponent(slug);
}

/**
 * @param {Array} articles nutrition_articles rows (title/excerpt/tags are {en,id})
 * @param {{lang?:string, urlTemplate?:string, heading?:string, readLabel?:string, max?:number}} opts
 * @returns {string} HTML, or "" when there is nothing to show
 */
export function renderRelatedArticles(articles, { lang = "id", urlTemplate = "", heading = "", readLabel = "", max = 3 } = {}) {
  const rows = (Array.isArray(articles) ? articles : []).slice(0, max);
  if (!rows.length) return "";
  const cards = rows
    .map((a) => {
      const title = localized(a && a.title, lang);
      if (!title) return "";
      const excerpt = localized(a && a.excerpt, lang);
      const href = articleHref(urlTemplate, (a && a.slug) || "");
      const mins = a && a.read_time_minutes ? `${a.read_time_minutes} ${readLabel}` : "";
      const cat = String((a && a.category) || "").replace(/-/g, " ");
      const accent = a && typeof a.accent === "string" && /^#[0-9a-fA-F]{3,8}$/.test(a.accent) ? a.accent : "";
      const style = accent ? ` style="--na-accent:${escapeHtml(accent)}"` : "";
      const open = href ? `<a class="na-card" href="${escapeHtml(href)}" target="_blank" rel="noopener"${style}>` : `<div class="na-card"${style}>`;
      const close = href ? "</a>" : "</div>";
      return `${open}
        ${cat ? `<span class="na-cat">${escapeHtml(cat)}</span>` : ""}
        <span class="na-title">${escapeHtml(title)}</span>
        ${excerpt ? `<span class="na-excerpt">${escapeHtml(excerpt)}</span>` : ""}
        ${mins ? `<span class="na-meta">${escapeHtml(mins)}</span>` : ""}
      ${close}`;
    })
    .join("");
  if (!cards.trim()) return "";
  return `<section class="na-related"><h3>${escapeHtml(heading)}</h3><div class="na-grid">${cards}</div></section>`;
}
