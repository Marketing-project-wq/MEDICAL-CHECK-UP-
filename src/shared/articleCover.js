// Article cover art. Every mcu-original article gets a visual on its card and
// at the top of its detail page.
//
// Real photos aren't sourced here (this build has no way to fetch/verify/
// license external images), so the default is a generated, on-brand cover:
// a flat topic-tinted panel + the matching line-icon motif (from icons.js),
// as inline SVG — dependency-free, no external requests, no CSP concerns.
//
// A real photo can be dropped in per article by setting `image` to a URL; when
// present it is used instead of the generated cover. Topic is derived from the
// slug/title, or set explicitly via `coverTheme`.

import { iconInner } from "./icons.js";
import { escapeHtml } from "./escape.js";

const THEMES = {
  // bg/icon: the generated cover. kw: a safe, on-topic keyword for the stock
  // photo so the image is relevant to the article's subject (not random).
  lab: { bg: "#2c6e8f", icon: "scan", kw: "laboratory" }, // lab markers / reading results
  nutrition: { bg: "#3b7a57", icon: "diet", kw: "vegetables" }, // food & nutrition
  activity: { bg: "#c05621", icon: "program", kw: "running" }, // physical activity
  consult: { bg: "#6b46c1", icon: "quiz", kw: "doctor" }, // consultation / literacy
  lifestyle: { bg: "#2d7d74", icon: "clinic", kw: "wellness" }, // sleep, stress, habits
  mcu: { bg: "#c53030", icon: "article", kw: "health" }, // general MCU / catch-all
};

// Theme -> i18n string key for the human-readable topic label.
const TOPIC_KEY = {
  lab: "topicLab",
  nutrition: "topicNutrition",
  activity: "topicActivity",
  consult: "topicConsult",
  lifestyle: "topicLifestyle",
  mcu: "topicMcu",
};

// i18n key for an article's topic label (derived from its theme).
export function topicKey(a) {
  return TOPIC_KEY[coverTheme(a)] || "topicMcu";
}

export function coverTheme(a) {
  if (a && a.coverTheme && THEMES[a.coverTheme]) return a.coverTheme;
  const k = (((a && a.slug) || "") + " " + ((a && a.title) || "")).toLowerCase();
  const has = (...w) => w.some((x) => k.includes(x));
  // Order matters: lab-specific tokens (e.g. "gula-darah") win over the bare
  // nutrition token ("gula").
  if (
    has(
      "gula-darah", "kolesterol", "lipid", "fungsi-hati", "fungsi-ginjal", "darah-lengkap",
      "asam-urat", "tes-urin", "urinalisis", "nilai-rujukan", "tanda-h-dan-l", "tekanan-darah",
      "penanda", "hasil-lab", "di-luar-rentang",
    )
  )
    return "lab";
  if (has("gula", "garam", "serat", "hidrasi", "lemak", "isi-piringku", "label-gizi", "makan")) return "nutrition";
  if (has("aktivitas", "jalan-kaki", "latihan-kekuatan", "pemanasan", "olahraga", "duduk", "bergerak")) return "activity";
  if (has("tidur", "stres", "merokok", "alkohol", "berat-badan", "jantung", "mata")) return "lifestyle";
  if (
    has(
      "pertanyaan-untuk-dokter", "skrining", "diagnosis", "mendiagnosis", "menyimpan-hasil",
      "faktor-risiko", "riwayat-kesehatan", "gejala-dan-tanda", "menunda-ke-dokter",
    )
  )
    return "consult";
  return "mcu";
}

// Flat, on-brand cover SVG (16:9-ish). No <defs>/ids, so it is safe to inline
// many times on one page (the list).
export function articleCoverSvg(theme) {
  const t = THEMES[theme] || THEMES.mcu;
  const motif = iconInner(t.icon) || "";
  return (
    `<svg class="cover-svg" viewBox="0 0 400 220" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">` +
    `<rect width="400" height="220" fill="${t.bg}"/>` +
    `<circle cx="338" cy="30" r="120" fill="#ffffff" opacity="0.07"/>` +
    `<circle cx="54" cy="212" r="88" fill="#000000" opacity="0.06"/>` +
    `<g transform="translate(150,60) scale(4.15)" fill="none" stroke="#ffffff" stroke-width="1.5" ` +
    `stroke-linecap="round" stroke-linejoin="round" opacity="0.96">${motif}</g>` +
    `</svg>`
  );
}

// Only allow a plain https URL with no characters that could break out of the
// CSS url('...') / HTML attribute context.
const CSS_URL_OK = /^https:\/\/[^\s'"()<>\\]+$/;

// Small deterministic number from the slug so each article keeps the same photo.
function lockNum(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 100000;
}

// The photo shown over the cover. An explicit `image` (e.g. a 20FIT brand photo)
// wins; otherwise a deterministic, ON-TOPIC stock photograph — keyworded by the
// article's theme so it's relevant to the subject (lab, food, exercise, doctor,
// wellness, health), not a random image. Returns "" when nothing safe is
// available (the themed SVG cover then shows on its own).
function photoUrl(a) {
  const explicit = a && typeof a.image === "string" ? a.image.trim() : "";
  if (explicit) return CSS_URL_OK.test(explicit) ? explicit : "";
  const t = THEMES[coverTheme(a || {})] || THEMES.mcu;
  return `https://loremflickr.com/1200/675/${t.kw}?lock=${lockNum(((a && a.slug) || "mcu"))}`;
}

// Cover block for a card (default) or a detail hero: the generated SVG sits at
// the base, and a photo layers over it. If the photo can't load, the SVG shows
// through — so the cover is never broken.
export function articleCover(a, { hero = false } = {}) {
  const cls = hero ? "article-cover article-cover-hero" : "article-cover";
  const svg = articleCoverSvg(coverTheme(a || {}));
  const url = photoUrl(a || {});
  const photo = url ? `<div class="cover-photo" style="background-image:url('${escapeHtml(url)}')"></div>` : "";
  return `<div class="${cls}">${svg}${photo}</div>`;
}
