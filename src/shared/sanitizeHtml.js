// Minimal, dependency-free defensive sanitizer for FIRST-PARTY article HTML
// (media_articles.body_html — 20FIT's own content pipeline, verified to be
// clean WordPress markup: p/h2-h4/ul/img, no <script>, no on* handlers).
//
// This is DEFENSE-IN-DEPTH, not the primary guard: the page's strict
// Content-Security-Policy (script-src 'self' 'nonce-…') already prevents any
// inline or external script in this HTML from executing. We still strip the
// obvious active-content vectors so a mistake upstream can't inject a script,
// an event handler, or a <style>/<iframe> that restyles or reframes our page.
//
// It deliberately leaves ordinary article markup untouched (p, h1-h6, ul/ol,
// a, img, figure, blockquote, strong/em, table). It is NOT a general-purpose
// sanitizer for arbitrary untrusted input — its scope is exactly this source.

export function sanitizeArticleHtml(html) {
  if (typeof html !== "string" || html.length === 0) return "";
  let out = html;
  // Drop whole dangerous element blocks (open tag … close tag), attrs and all.
  out = out.replace(/<(script|style|iframe|object|embed|form|link|meta)\b[\s\S]*?<\/\1\s*>/gi, "");
  // Drop any leftover self-closing / unclosed dangerous tags.
  out = out.replace(/<\/?(script|style|iframe|object|embed|form|link|meta)\b[^>]*>/gi, "");
  // Strip inline event-handler attributes: on…="…" | '…' | bare.
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");
  // Neutralize javascript:/vbscript: URLs in href/src.
  out = out.replace(/\b(href|src)\s*=\s*"(?:\s*(?:javascript|vbscript):)[^"]*"/gi, '$1="#"');
  out = out.replace(/\b(href|src)\s*=\s*'(?:\s*(?:javascript|vbscript):)[^']*'/gi, "$1='#'");
  return out;
}
