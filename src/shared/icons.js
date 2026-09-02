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

const ICONS = {
  // Lab report being read — "Check & Scan MCU"
  scan: `<svg ${A}><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/><path d="M13 3v6h6"/><path d="M9 13h6M9 16h4"/></svg>`,
  // Question mark in a circle — "Health Quiz"
  quiz: `<svg ${A}><circle cx="12" cy="12" r="9"/><path d="M9.4 9.3a2.7 2.7 0 0 1 5.1 1c0 1.8-2.5 2-2.5 3.4"/><path d="M12 17.1h.01"/></svg>`,
  // Dumbbell — "Programs & Training"
  program: `<svg ${A}><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/></svg>`,
  // Framed lines of text — "Health Articles"
  article: `<svg ${A}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 12h8M8 15h5"/></svg>`,
  // Leaf — healthy-eating checklist item
  diet: `<svg ${A}><path d="M5 19c0-8 5-13 14-13 0 9-5 14-13 13z"/><path d="M8.5 15.5c2.5-2.5 4.5-4 7.5-5"/></svg>`,
  // Activity/heartbeat line — movement checklist item
  walk: `<svg ${A}><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>`,
  // Medical cross — clinic/lab follow-up checklist item
  clinic: `<svg ${A}><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8.5v7M8.5 12h7"/></svg>`,
};

export function iconSvg(name) {
  return Object.prototype.hasOwnProperty.call(ICONS, name) ? ICONS[name] : null;
}
