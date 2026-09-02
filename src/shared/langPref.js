// Single source of truth for the persisted language-preference storage key,
// shared between the server-rendered pre-paint redirect script
// (src/views/layout.js) and the client toggle handler (src/client/app.js).
export const LANG_STORAGE_KEY = "mcu20fit-lang";

/**
 * Maps a pathname to its equivalent in the other language, by adding/removing
 * the "/id" prefix. Pure so the client toggle (app.js) is unit-testable.
 *   equivalentLangPath("/home", "id")        → "/id/home"
 *   equivalentLangPath("/id/articles/x","en")→ "/articles/x"
 *   equivalentLangPath("/", "id")            → "/id"
 *   equivalentLangPath("/id", "en")          → "/"
 */
export function equivalentLangPath(pathname, newLang) {
  const isId = pathname === "/id" || pathname.indexOf("/id/") === 0;
  const base = isId ? pathname.slice(3) || "/" : pathname; // strip any /id prefix
  return newLang === "id" ? "/id" + (base === "/" ? "" : base) : base;
}
