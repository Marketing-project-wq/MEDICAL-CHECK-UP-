// medicalcheckup.20fit.id — zero-dependency Node HTTP server.
// Serves server-rendered educational pages (SEO), the example analysis, static
// assets, and the browser client. No AI, no file storage, no service keys here.

import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

import { renderLayout } from "./views/layout.js";
import { renderLandingPage, renderHomeHubPage } from "./views/pages.js";
import { articleListPage, articleDetailPage } from "./views/articles.js";
import { getStrings } from "./shared/i18n.js";
import { escapeHtml } from "./shared/escape.js";
import { createSupabaseAdmin } from "./server/supabaseRest.js";
import { createScanHandlers } from "./server/scanHandlers.js";
import { createArticleStore } from "./server/articles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const SRC_DIR = __dirname;

const PORT = Number(process.env.PORT) || 3000;
const MY20FIT_ORIGIN = (process.env.MY20FIT_ORIGIN || "https://my.20fit.id").replace(/\/$/, "");
const SUPABASE_URL = (process.env.SUPABASE_URL || "https://cpvzwqptzcxnwzfzgrmt.supabase.co").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || "https://medicalcheckup.20fit.id").replace(/\/$/, "");
// Official escalation target for every health tool (spec: awareness tools must
// route "want more? consult a doctor" to the real in-app Book Doctor flow).
// Override once the exact my.20fit.id route is confirmed.
const DOCTOR_BOOKING_URL = process.env.DOCTOR_BOOKING_URL || MY20FIT_ORIGIN + "/book-doctor";
// Booking/info destinations for the "Program & Training" section (Tahap 3+4).
// Real 20FIT service lines; no packages/prices are invented here. Each defaults
// to my.20fit.id (a safe real destination) — override with the exact booking
// pages (studio / arena / clinic / home-workout) once confirmed.
const TRAINING_LINKS = {
  home: process.env.TRAIN_HOME_URL || MY20FIT_ORIGIN,
  ems: process.env.TRAIN_EMS_URL || MY20FIT_ORIGIN,
  arena: process.env.TRAIN_ARENA_URL || MY20FIT_ORIGIN,
  clinic: process.env.TRAIN_CLINIC_URL || MY20FIT_ORIGIN,
  my: MY20FIT_ORIGIN,
};
// Hotlinked from media.20fit.id at the user's explicit direction (this
// sandbox cannot fetch the source files itself to re-host them — see PR
// #10/#8 — and the user has no other way to hand them over). If that host
// ever adds hotlink protection or goes down, these break simultaneously;
// the client-side fallback in app.js/layout.js (img.onerror -> plain
// "20FIT" text) covers that case so a break here never leaves empty space.
// Override via env (e.g. once real files exist in Supabase Storage or this
// app's own public/) — no other code needs to change either way.
const LOGO_LIGHT_URL = process.env.LOGO_LIGHT_URL || "https://media.20fit.id/wp-content/uploads/2026/05/Logo-20fit.png";
const LOGO_DARK_URL =
  process.env.LOGO_DARK_URL || "https://media.20fit.id/wp-content/uploads/2026/05/Copy-of-new-logo-20fit-putih-3.png";

const supabaseOrigin = safeOrigin(SUPABASE_URL);

// Service-role client: server-only, used by /api/scan to verify the member's
// token and write the AI-access audit log. Lazily constructed so a missing
// key doesn't crash page rendering — /api/scan itself fails clearly if it's
// actually invoked without one.
let supabaseAdmin = null;
let scanHandlers = null;
function getScanHandlers() {
  if (scanHandlers) return scanHandlers;
  if (!SUPABASE_SERVICE_ROLE_KEY) return null;
  supabaseAdmin = createSupabaseAdmin({
    url: SUPABASE_URL,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    anonKey: SUPABASE_ANON_KEY,
  });
  scanHandlers = createScanHandlers({ supabaseAdmin, my20fitOrigin: MY20FIT_ORIGIN });
  return scanHandlers;
}

// Article store (Tahap 1): reads published media_articles server-side. Lazily
// constructed; a missing service-role key just yields an empty list / 404
// rather than crashing the page.
let articleStore = null;
function getArticleStore() {
  if (articleStore) return articleStore;
  if (!SUPABASE_SERVICE_ROLE_KEY) return null;
  articleStore = createArticleStore({ supabaseUrl: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY });
  return articleStore;
}

function safeOrigin(u) {
  try {
    return new URL(u).origin;
  } catch {
    return "";
  }
}

const MIME = {
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

// Static roots the browser is allowed to read from, keyed by URL prefix.
const STATIC_ROOTS = [
  { prefix: "/client/", dir: path.join(SRC_DIR, "client") },
  { prefix: "/shared/", dir: path.join(SRC_DIR, "shared") },
  // pages.js is dependency-free (only imports from shared/) and is reused
  // client-side so the language toggle re-renders from the SAME source the
  // server uses — no separately-maintained list of translatable strings
  // that could fall out of sync and silently miss a spot.
  { prefix: "/views/", dir: path.join(SRC_DIR, "views") },
  { prefix: "/public/", dir: PUBLIC_DIR },
];

function securityHeaders(nonce, { relaxImg = false } = {}) {
  // Article bodies embed images from the WordPress media library (and
  // occasionally other hosts). Those are images only — they can't execute —
  // so article pages widen img-src to any https host; scripts stay locked to
  // 'self' + nonce everywhere.
  const imgSrc = relaxImg
    ? "img-src 'self' data: blob: https:"
    : `img-src 'self' data: blob: ${supabaseOrigin} https://media.20fit.id`;
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' " + MY20FIT_ORIGIN,
    imgSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net`,
    "worker-src 'self' blob: https://cdn.jsdelivr.net",
    `connect-src 'self' ${MY20FIT_ORIGIN} ${supabaseOrigin} https://cdn.jsdelivr.net`,
  ].join("; ");
  return {
    "Content-Security-Policy": csp,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  };
}

function clientConfig(lang) {
  return {
    lang,
    apiBase: MY20FIT_ORIGIN,
    loginUrl: MY20FIT_ORIGIN + "/login",
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    publicOrigin: PUBLIC_ORIGIN,
    logoLightUrl: LOGO_LIGHT_URL,
    logoDarkUrl: LOGO_DARK_URL,
    doctorBookingUrl: DOCTOR_BOOKING_URL,
  };
}

function sendHtml(res, status, html, nonce, opts = {}) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, max-age=300",
    ...securityHeaders(nonce, opts),
  });
  res.end(html);
}

function wrapPage(lang, canonicalPath, page) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const html = renderLayout({
    lang,
    strings: strings(lang),
    title: page.title,
    description: page.description,
    canonicalPath,
    publicOrigin: PUBLIC_ORIGIN,
    bodyHtml: page.bodyHtml,
    clientConfig: clientConfig(lang),
    nonce,
    logoLightUrl: LOGO_LIGHT_URL,
    logoDarkUrl: LOGO_DARK_URL,
  });
  return { html, nonce };
}

function renderLanding(lang, canonicalPath) {
  const page = renderLandingPage({ lang, publicOrigin: PUBLIC_ORIGIN, loginUrl: MY20FIT_ORIGIN + "/login", canonicalPath });
  return wrapPage(lang, canonicalPath, page);
}

async function renderHomeHub(lang, canonicalPath) {
  const store = getArticleStore();
  const featuredArticles = store ? await store.listPublished({ limit: 3 }) : [];
  const page = renderHomeHubPage({
    lang,
    publicOrigin: PUBLIC_ORIGIN,
    loginUrl: MY20FIT_ORIGIN + "/login",
    canonicalPath,
    featuredArticles,
    bookingUrl: DOCTOR_BOOKING_URL,
    trainingLinks: TRAINING_LINKS,
  });
  return wrapPage(lang, canonicalPath, page);
}

function strings(lang) {
  return getStrings(lang);
}

function render404(lang) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const s = strings(lang);
  const homePath = lang === "id" ? "/id" : "/";
  const body = `<section class="section"><div class="wrap"><h1>${escapeHtml(s.notFoundTitle)}</h1><p>${escapeHtml(
    s.notFoundBody,
  )}</p><p><a href="${escapeHtml(homePath)}">${escapeHtml(s.notFoundBackHome)}</a></p></div></section>`;
  const html = renderLayout({
    lang,
    strings: s,
    title: "404 — " + s.brand,
    description: "",
    canonicalPath: homePath,
    publicOrigin: PUBLIC_ORIGIN,
    bodyHtml: body,
    clientConfig: clientConfig(lang),
    nonce,
    logoLightUrl: LOGO_LIGHT_URL,
    logoDarkUrl: LOGO_DARK_URL,
  });
  return { html, nonce };
}

// Article pages carry a per-page canonical (detail → the media.20fit original)
// and drop the home-only hreflang alternates.
function renderArticleLayout(lang, canonicalPath, page) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const html = renderLayout({
    lang,
    strings: strings(lang),
    title: page.title,
    description: page.description,
    canonicalPath,
    canonicalOverride: page.canonical || null,
    suppressAlternates: true,
    publicOrigin: PUBLIC_ORIGIN,
    bodyHtml: page.bodyHtml,
    clientConfig: clientConfig(lang),
    nonce,
    logoLightUrl: LOGO_LIGHT_URL,
    logoDarkUrl: LOGO_DARK_URL,
  });
  return { html, nonce };
}

async function handleArticles(res, lang, slug) {
  const s = strings(lang);
  const store = getArticleStore();
  const listPath = lang === "id" ? "/id/articles" : "/articles";
  if (slug) {
    const article = store ? await store.getBySlug(slug) : null;
    if (!article) {
      const { html, nonce } = render404(lang);
      sendHtml(res, 404, html, nonce);
      return;
    }
    const page = articleDetailPage({ s, lang, article, bookingUrl: DOCTOR_BOOKING_URL });
    const { html, nonce } = renderArticleLayout(lang, `${listPath}/${slug}`, page);
    // relaxImg: article bodies embed WordPress/media images from various hosts.
    sendHtml(res, 200, html, nonce, { relaxImg: true });
    return;
  }
  const articles = store ? await store.listPublished({ limit: 30 }) : [];
  const page = articleListPage({ s, lang, articles });
  const { html, nonce } = renderArticleLayout(lang, listPath, page);
  sendHtml(res, 200, html, nonce);
}

async function serveStatic(req, res, pathname) {
  const match = STATIC_ROOTS.find((r) => pathname.startsWith(r.prefix));
  if (!match) return false;
  const rel = decodeURIComponent(pathname.slice(match.prefix.length));
  const resolved = path.resolve(match.dir, rel);
  // Path-traversal guard: resolved must stay within the allowed dir.
  if (resolved !== match.dir && !resolved.startsWith(match.dir + path.sep)) {
    res.writeHead(403).end("Forbidden");
    return true;
  }
  try {
    const data = await readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=600",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
  return true;
}

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }
  const pathname = url.pathname;

  // /api/scan: the only POST route this app serves. Members-only per spec
  // §0.1 (the gate is at upload — an anonymous request is rejected before any
  // analysis). AI is still only ever called server-side; no AI key or
  // service-role key ships to the browser.
  if (req.method === "POST" && pathname === "/api/scan") {
    const handlers = getScanHandlers();
    if (!handlers) {
      res.writeHead(503, { "Content-Type": "application/json" }).end(
        JSON.stringify({ ok: false, code: "service_unavailable" }),
      );
      return;
    }
    await handlers.handleScan(req, res);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }

  // Health check
  if (pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" }).end("ok");
    return;
  }

  // SEO helpers
  if (pathname === "/robots.txt") {
    res.writeHead(200, { "Content-Type": MIME[".txt"] }).end(
      `User-agent: *\nAllow: /\nSitemap: ${PUBLIC_ORIGIN}/sitemap.xml\n`,
    );
    return;
  }
  if (pathname === "/sitemap.xml") {
    const now = new Date().toISOString().slice(0, 10);
    res.writeHead(200, { "Content-Type": MIME[".xml"] }).end(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `<url><loc>${PUBLIC_ORIGIN}/</loc><lastmod>${now}</lastmod></url>\n` +
        `<url><loc>${PUBLIC_ORIGIN}/id</loc><lastmod>${now}</lastmod></url>\n` +
        `<url><loc>${PUBLIC_ORIGIN}/home</loc><lastmod>${now}</lastmod></url>\n` +
        `<url><loc>${PUBLIC_ORIGIN}/id/home</loc><lastmod>${now}</lastmod></url>\n` +
        // Article LIST pages only. Individual articles canonical-point to
        // media.20fit.id, so they're intentionally kept out of this sitemap.
        `<url><loc>${PUBLIC_ORIGIN}/articles</loc><lastmod>${now}</lastmod></url>\n` +
        `<url><loc>${PUBLIC_ORIGIN}/id/articles</loc><lastmod>${now}</lastmod></url>\n` +
        `</urlset>\n`,
    );
    return;
  }

  // Root-level convenience aliases (serve straight from public/, no /public/
  // prefix) — logos in particular are referenced from the very first
  // pre-paint <script> in <head>, so they stay on the same simple,
  // well-tested path convention as styles.css rather than a nested prefix.
  const ROOT_ALIASES = { "/styles.css": "styles.css", "/logo-light.svg": "logo-light.svg", "/logo-dark.svg": "logo-dark.svg" };
  if (ROOT_ALIASES[pathname]) {
    try {
      const file = await readFile(path.join(PUBLIC_DIR, ROOT_ALIASES[pathname]));
      const ext = path.extname(ROOT_ALIASES[pathname]).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=600",
      });
      res.end(file);
    } catch {
      res.writeHead(404).end("Not found");
    }
    return;
  }

  // Static assets
  if (STATIC_ROOTS.some((r) => pathname.startsWith(r.prefix))) {
    await serveStatic(req, res, pathname);
    return;
  }

  // Pages (English default, Indonesian at /id). /auth/callback shares the
  // English page — the client handles the SSO fragment on load, then
  // continues here. /en is a legacy alias from before English became the
  // default — redirected to / rather than served twice, so there's a
  // single canonical URL per language.
  if (pathname === "/" || pathname === "/auth/callback") {
    const { html, nonce } = renderLanding("en", "/");
    sendHtml(res, 200, html, nonce);
    return;
  }
  if (pathname === "/id" || pathname === "/id/" || pathname === "/id/auth/callback") {
    const { html, nonce } = renderLanding("id", "/id");
    sendHtml(res, 200, html, nonce);
    return;
  }
  // Home hub — the app (Scan MCU, Quiz, Articles). Public; only the scan
  // upload itself requires login (§0.1). /auth/callback for the hub lands here
  // too so the SSO fragment is consumed on the page the member returned to.
  if (pathname === "/home" || pathname === "/home/" || pathname === "/home/auth/callback") {
    const { html, nonce } = await renderHomeHub("en", "/home");
    sendHtml(res, 200, html, nonce);
    return;
  }
  if (pathname === "/id/home" || pathname === "/id/home/" || pathname === "/id/home/auth/callback") {
    const { html, nonce } = await renderHomeHub("id", "/id/home");
    sendHtml(res, 200, html, nonce);
    return;
  }
  if (pathname === "/en" || pathname === "/en/" || pathname === "/en/auth/callback") {
    res.writeHead(302, { Location: pathname.replace(/^\/en/, "") || "/" }).end();
    return;
  }

  // Articles (Tahap 1): /articles + /articles/<slug> (EN),
  // /id/articles + /id/articles/<slug> (ID).
  const artMatch = pathname.match(/^\/(?:(id)\/)?articles(?:\/([^/]+))?\/?$/);
  if (artMatch) {
    const artLang = artMatch[1] === "id" ? "id" : "en";
    const slug = artMatch[2] ? decodeURIComponent(artMatch[2]) : null;
    await handleArticles(res, artLang, slug);
    return;
  }

  // 404
  const lang = pathname.startsWith("/id") ? "id" : "en";
  const { html, nonce } = render404(lang);
  sendHtml(res, 404, html, nonce);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `medicalcheckup subdomain listening on :${PORT} — api=${MY20FIT_ORIGIN} supabase=${supabaseOrigin} anonKey=${
      SUPABASE_ANON_KEY ? "set" : "MISSING"
    }`,
  );
});

export default server;
