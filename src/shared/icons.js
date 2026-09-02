// Minimalist monochrome line icons (inline SVG), used in place of emoji so the
// UI reads as clean, restrained symbols. Each entry is a TRUSTED, static <svg>
// string that inherits the current text color and sizes to 1em (control the
// size via the container's font-size).
//
// Callers render the result RAW inside an aria-hidden wrapper. Never pass
// untrusted input here: unknown names return null so the caller can fall back
// to escaping (keeps the renderResult injection guard intact).

const A =
  'width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

// Inner SVG path data (24x24 coordinate space), reused both for the wrapped 1em
// icons and — scaled up — for the generated article cover art.
const PATHS = {
  // Lab report being read — "Check & Scan MCU"
  scan: `<path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/><path d="M13 3v6h6"/><path d="M9 13h6M9 16h4"/>`,
  // Question mark in a circle — "Health Quiz"
  quiz: `<circle cx="12" cy="12" r="9"/><path d="M9.4 9.3a2.7 2.7 0 0 1 5.1 1c0 1.8-2.5 2-2.5 3.4"/><path d="M12 17.1h.01"/>`,
  // Dumbbell — "Programs & Training"
  program: `<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>`,
  // Framed lines of text — "Health Articles"
  article: `<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 12h8M8 15h5"/>`,
  // Leaf — healthy-eating checklist item
  diet: `<path d="M5 19c0-8 5-13 14-13 0 9-5 14-13 13z"/><path d="M8.5 15.5c2.5-2.5 4.5-4 7.5-5"/>`,
  // Activity/heartbeat line — movement checklist item
  walk: `<path d="M3 12h4l2-6 4 12 2-6h6"/>`,
  // Medical cross — clinic/lab follow-up checklist item
  clinic: `<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8.5v7M8.5 12h7"/>`,
};

export function iconSvg(name) {
  return Object.prototype.hasOwnProperty.call(PATHS, name) ? `<svg ${A}>${PATHS[name]}</svg>` : null;
}

// Raw inner path markup for a named icon (no <svg> wrapper), or null. Used by
// the article cover generator to embed the motif at a large scale.
export function iconInner(name) {
  return Object.prototype.hasOwnProperty.call(PATHS, name) ? PATHS[name] : null;
}
