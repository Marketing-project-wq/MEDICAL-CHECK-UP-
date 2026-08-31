// Dependency-free HTML escaping, shared by server (SSR) and browser client.

/** Escape a value for safe insertion into HTML text/attribute context. */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Line/paragraph separators are valid in JSON but NOT in JS string literals,
// so they must be escaped when embedding JSON inside a <script> tag. Build the
// characters via char codes to keep this source pure ASCII.
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);

/** Escape a JS object for safe embedding inside a <script> tag. */
export function escapeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(LINE_SEP)
    .join("\\u2028")
    .split(PARA_SEP)
    .join("\\u2029");
}
