// medicalcheckup.20fit.id — zero-dependency Node HTTP server.
// Serves server-rendered educational pages (SEO), the example analysis, static
// assets, and the browser client. No AI, no file storage, no service keys here.

import http from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

import { renderLayout } from "./views/layout.js";
import { renderHomeHubPage, renderCheckMcuPage, renderHistoryPage, renderScanDetailPage } from "./views/pages.js";
import { renderLoginPage, renderRegisterPage, renderResetPage, renderCallbackPage } from "./views/authPages.js";
import { safeNextPath } from "./shared/returnTo.js";
import { renderQuizHubPage, renderQuizPage } from "./views/quizPages.js";
import { renderApiDocsPage } from "./views/docsPage.js";
import { articleListPage, articleDetailPage } from "./views/articles.js";
import { getStrings } from "./shared/i18n.js";
import { escapeHtml } from "./shared/escape.js";
import { createSupabaseAdmin } from "./server/supabaseRest.js";
import { createScanHandlers } from "./server/scanHandlers.js";
import { createArticleStore, toPublicJson } from "./server/articles.js";
import { createArticleHandlers } from "./server/articleHandlers.js";
import { createQuizStore } from "./server/quizzes.js";
import { createQuizHandlers } from "./server/quizHandlers.js";
import { createPartnerAuth } from "./server/partnerAuth.js";
import { LOCAL_ARTICLES } from "./shared/localArticles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const SRC_DIR = __dirname;

const PORT = Number(process.env.PORT) || 3000;
const MY20FIT_ORIGIN = (process.env.MY20FIT_ORIGIN || "https://my.20fit.id").replace(/\/$/, "");
const SUPABASE_URL = (process.env.SUPABASE_URL || "https://cpvzwqptzcxnwzfzgrmt.supabase.co").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
// Shared secret external sites send (Authorization: Bearer <token>) to
// POST /api/articles. Unset → the publish endpoint is inert (503).
const ARTICLES_PUBLISH_TOKEN = process.env.ARTICLES_PUBLISH_TOKEN || "";
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || "https://medicalscanner.20fit.id").replace(/\/$/, "");
// Official escalation target for every health tool (spec: awareness tools must
// route "want more? consult a doctor" to the real in-app Book Doctor flow).
// Override once the exact my.20fit.id route is confirmed.
const DOCTOR_BOOKING_URL = process.env.DOCTOR_BOOKING_URL || MY20FIT_ORIGIN + "/book-doctor";
// 20FIT Sports Clinic escalation on the MCU page. The contact URL defaults to
// the real doctor-booking flow (never a hardcoded phone number) — set
// CLINIC_CONTACT_URL to a WhatsApp link (e.g. https://wa.me/<number>) to use
// that instead. Address is overridable via CLINIC_ADDRESS.
const CLINIC_CONTACT_URL = process.env.CLINIC_CONTACT_URL || DOCTOR_BOOKING_URL;
const CLINIC_ADDRESS =
  process.env.CLINIC_ADDRESS || "20FIT Sports Clinic — Jl. Sinabung No. 9, Kebayoran Baru, Jakarta Selatan";
// "Related nutrition articles" link out to the calorietracker.20fit.id content
// (nutrition_articles). The path is env-configurable ({slug} is substituted) so
// no article URL is hardcoded/guessed in code — confirm/adjust to the real path.
const NUTRITION_ARTICLES_URL_TEMPLATE =
  process.env.NUTRITION_ARTICLES_URL_TEMPLATE || "https://calorietracker.20fit.id/artikel/{slug}";
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

// OpenAPI spec for this app's 3 JSON API endpoints (src/openapi/), served at
// /api/openapi.json + /api/openapi.yaml + /api/docs. Loaded once at startup —
// these are small static files, not user content. openapi.yaml is generated
// FROM openapi.json (see its header comment); both are hand-reviewed, never
// contain real secrets/credentials (placeholders only).
const OPENAPI_JSON_TEXT = readFileSync(path.join(SRC_DIR, "openapi", "openapi.json"), "utf8");
const OPENAPI_YAML_TEXT = readFileSync(path.join(SRC_DIR, "openapi", "openapi.yaml"), "utf8");

// Service-role client: server-only, used to verify a member's token and
// (for /api/scan) write the AI-access audit log. Lazily constructed so a
// missing key doesn't crash page rendering — each route that needs it fails
// clearly on its own if actually invoked without one.
let supabaseAdmin = null;
function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  if (!SUPABASE_SERVICE_ROLE_KEY) return null;
  supabaseAdmin = createSupabaseAdmin({
    url: SUPABASE_URL,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    anonKey: SUPABASE_ANON_KEY,
  });
  return supabaseAdmin;
}

let scanHandlers = null;
function getScanHandlers() {
  if (scanHandlers) return scanHandlers;
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  scanHandlers = createScanHandlers({ supabaseAdmin: admin, my20fitOrigin: MY20FIT_ORIGIN });
  return scanHandlers;
}

// Quiz content store: needs the service-role key too (outcomes/results are
// RLS service-role-only — see server/quizzes.js). Quizzes/questions still
// render (publicly readable content) even without one; only submit/history
// fail clearly if actually invoked.
let quizStore = null;
function getQuizStore() {
  if (quizStore) return quizStore;
  quizStore = createQuizStore({ supabaseUrl: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY, anonKey: SUPABASE_ANON_KEY });
  return quizStore;
}

// Optional partner API-key verifier for /api/quiz/submit ONLY — see
// server/partnerAuth.js for why this never applies to /api/scan or
// /api/quiz/history. Same lazy-construct pattern as the rest of this file.
let partnerAuth = null;
function getPartnerAuth() {
  if (partnerAuth) return partnerAuth;
  if (!SUPABASE_SERVICE_ROLE_KEY) return null;
  partnerAuth = createPartnerAuth({ supabaseUrl: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY });
  return partnerAuth;
}

let quizHandlers = null;
function getQuizHandlers() {
  if (quizHandlers) return quizHandlers;
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  quizHandlers = createQuizHandlers({ quizStore: getQuizStore(), supabaseAdmin: admin, partnerAuth: getPartnerAuth() });
  return quizHandlers;
}

// Article store (Tahap 1): serves the mcu-original (local) health articles
// always, plus published media_articles when a service-role key is present.
// Constructed unconditionally so the mcu-original articles render even without
// Supabase env; a missing key just skips the media_articles fetch (empty media
// list) rather than hiding every article.
let articleStore = null;
function getArticleStore() {
  if (articleStore) return articleStore;
  articleStore = createArticleStore({ supabaseUrl: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY });
  return articleStore;
}

// Publish API (POST /api/articles): external sites publish into this subdomain's
// own mcu_articles table. The handler self-gates (503) when the publish token or
// service-role key is missing, so it stays inert until deliberately configured.
let articleHandlers = null;
function getArticleHandlers() {
  if (articleHandlers) return articleHandlers;
  articleHandlers = createArticleHandlers({
    articleStore: getArticleStore(),
    publishToken: ARTICLES_PUBLISH_TOKEN,
    publicOrigin: PUBLIC_ORIGIN,
    hasServiceRole: Boolean(SUPABASE_SERVICE_ROLE_KEY),
  });
  return articleHandlers;
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
  // Branded product icons for the universal-nav app switcher, served locally
  // (copied from the ecosystem) so they always load — no cross-origin fetch.
  { prefix: "/img/", dir: path.join(PUBLIC_DIR, "img") },
];

function securityHeaders(nonce, { relaxImg = false } = {}) {
  // Article bodies embed images from the WordPress media library (and
  // occasionally other hosts). Those are images only — they can't execute —
  // so article pages widen img-src to any https host; scripts stay locked to
  // 'self' + nonce everywhere.
  const imgSrc = relaxImg
    ? "img-src 'self' data: blob: https:"
    : `img-src 'self' data: blob: ${supabaseOrigin} https://media.20fit.id ${MY20FIT_ORIGIN}`;
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
    loginUrl: "/login",
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    publicOrigin: PUBLIC_ORIGIN,
    logoLightUrl: LOGO_LIGHT_URL,
    logoDarkUrl: LOGO_DARK_URL,
    doctorBookingUrl: DOCTOR_BOOKING_URL,
    nutritionUrlTemplate: NUTRITION_ARTICLES_URL_TEMPLATE,
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

async function renderHomeHub(lang, canonicalPath) {
  const store = getArticleStore();
  // Pass a broad set so the hub's "Top 5" can pick the 5 most recent by date.
  const featuredArticles = store ? await store.listPublished({ limit: 60 }) : [];
  const page = renderHomeHubPage({
    lang,
    publicOrigin: PUBLIC_ORIGIN,
    loginUrl: "/login",
    canonicalPath,
    featuredArticles,
    bookingUrl: DOCTOR_BOOKING_URL,
    trainingLinks: TRAINING_LINKS,
  });
  return wrapPage(lang, canonicalPath, page);
}

// Check MCU — the standalone Scan MCU tool page (§0.1 gate lives here).
function renderCheckMcu(lang, canonicalPath) {
  const page = renderCheckMcuPage({
    lang,
    publicOrigin: PUBLIC_ORIGIN,
    loginUrl: "/login",
    canonicalPath,
    bookingUrl: DOCTOR_BOOKING_URL,
    clinicContactUrl: CLINIC_CONTACT_URL,
    clinicAddress: CLINIC_ADDRESS,
  });
  return wrapPage(lang, canonicalPath, page);
}

// Built-in auth pages redirect a member back to where they were headed after
// login. `next` accepts either ?next=<internal path> or a ?return_to on THIS
// origin (so the existing return_to plumbing keeps working), validated to a
// safe same-origin path — the open-redirect guard (spec Langkah 3).
function authNext(url) {
  const direct = url.searchParams.get("next");
  if (direct) return safeNextPath(direct, "");
  const rt = url.searchParams.get("return_to");
  if (rt) {
    try {
      const u = new URL(rt);
      if (u.origin === PUBLIC_ORIGIN) return safeNextPath(u.pathname + u.search, "");
    } catch {
      /* ignore a malformed return_to */
    }
  }
  return "";
}

// MCU history — a dedicated, deep-linkable list of the member's saved scans.
// Member-only content is fetched client-side (RLS); SSR only ships the shell.
function renderHistory(lang, canonicalPath) {
  const page = renderHistoryPage({
    lang,
    loginUrl: "/login",
    returnToUrl: PUBLIC_ORIGIN + canonicalPath,
  });
  return wrapPage(lang, canonicalPath, page);
}

// One saved scan's detail (deep-linkable). `scanId` is echoed into the shell as
// a data attribute for the client to fetch under the member's own session.
function renderScanDetail(lang, canonicalPath, scanId) {
  const page = renderScanDetailPage({
    lang,
    loginUrl: "/login",
    returnToUrl: PUBLIC_ORIGIN + canonicalPath,
    scanId,
    clinicContactUrl: CLINIC_CONTACT_URL,
    clinicAddress: CLINIC_ADDRESS,
  });
  return wrapPage(lang, canonicalPath, page);
}

// Quiz hub — lists every active CMS-driven quiz (BMI, Runner, HYROX, …).
async function renderQuizHub(lang, canonicalPath) {
  const quizzes = await getQuizStore().listActive();
  const page = renderQuizHubPage({ lang, quizzes, bookingUrl: DOCTOR_BOOKING_URL });
  return wrapPage(lang, canonicalPath, page);
}

// One quiz's wizard page. Returns null if the slug doesn't match an active
// quiz (caller falls back to 404).
async function renderQuizDetail(lang, canonicalPath, slug) {
  const quiz = await getQuizStore().getBySlug(slug);
  if (!quiz) return null;
  const page = renderQuizPage({
    lang,
    quiz,
    loginUrl: "/login",
    returnToUrl: PUBLIC_ORIGIN + canonicalPath,
    bookingUrl: DOCTOR_BOOKING_URL,
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
  // High limit so the full mcu-original library renders on the list page
  // (local articles are always returned first, then media rows fill any room).
  const articles = store ? await store.listPublished({ limit: 200 }) : [];
  const page = articleListPage({ s, lang, articles });
  const { html, nonce } = renderArticleLayout(lang, listPath, page);
  // relaxImg: article cards carry cover photos (article `image` or the stock
  // fallback) that may be served from other https hosts.
  sendHtml(res, 200, html, nonce, { relaxImg: true });
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

  // /api/articles[/:slug]: the article publish/management API for external
  // developers (Bearer token; body_html sanitized; writes via the server-side
  // service-role key only, into this subdomain's own mcu_articles table).
  //   POST /api/articles        create or update (upsert on slug)
  //   GET  /api/articles        list (?status=all|draft|published&limit=&offset=)
  //   GET  /api/articles/:slug  read one
  //   PATCH /api/articles/:slug partial update
  //   DELETE /api/articles/:slug delete
  // Self-gates to 503 until the publish token + service-role key are configured.
  if (pathname === "/api/articles" || pathname.startsWith("/api/articles/")) {
    const h = getArticleHandlers();
    const slug = pathname.startsWith("/api/articles/")
      ? decodeURIComponent(pathname.slice("/api/articles/".length)).replace(/\/+$/, "")
      : "";
    if (!slug) {
      if (req.method === "POST") { await h.handlePublish(req, res); return; }
      if (req.method === "GET") { await h.handleList(req, res); return; }
    } else {
      if (req.method === "GET") { await h.handleGetOne(req, res, slug); return; }
      if (req.method === "PATCH") { await h.handleUpdate(req, res, slug); return; }
      if (req.method === "DELETE") { await h.handleDelete(req, res, slug); return; }
    }
    res
      .writeHead(405, { "Content-Type": "application/json", Allow: "GET, POST, PATCH, DELETE" })
      .end(JSON.stringify({ ok: false, code: "method_not_allowed" }));
    return;
  }

  // /api/quiz/submit: answerable anonymously by design (spec: the result is
  // shown in full to everyone; only saving/history is gated). The outcome
  // evaluation (including the BMI safety branches) happens only inside the
  // handler, never in the browser.
  if (req.method === "POST" && pathname === "/api/quiz/submit") {
    const handlers = getQuizHandlers();
    if (!handlers) {
      res.writeHead(503, { "Content-Type": "application/json" }).end(
        JSON.stringify({ ok: false, code: "service_unavailable" }),
      );
      return;
    }
    await handlers.handleSubmit(req, res);
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

  // Config diagnostic — reports only whether each env var is PRESENT (never its
  // value) plus a live count from the quiz read, so a misconfigured deploy env
  // (e.g. a missing SUPABASE_ANON_KEY that leaves /quiz empty) can be spotted
  // from the browser. No secrets are exposed; the quiz list is already public.
  if (pathname === "/api/diag") {
    let quiz;
    try {
      const rows = await getQuizStore().listActive();
      quiz = { activeCount: Array.isArray(rows) ? rows.length : 0 };
    } catch {
      quiz = { error: "read_failed" };
    }
    const present = (v) => (v ? "set" : "MISSING");
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }).end(
      JSON.stringify({
        ok: true,
        service: "medicalcheckup",
        build: "diag-1",
        supabaseHost: supabaseOrigin,
        env: {
          SUPABASE_URL: present(SUPABASE_URL),
          SUPABASE_ANON_KEY: present(SUPABASE_ANON_KEY),
          SUPABASE_SERVICE_ROLE_KEY: present(SUPABASE_SERVICE_ROLE_KEY),
          MY20FIT_ORIGIN: present(process.env.MY20FIT_ORIGIN),
        },
        quiz,
      }),
    );
    return;
  }

  // OpenAPI docs for this app's 3 JSON API endpoints — additive, read-only
  // exposure of the spec; does not affect any existing endpoint's behavior.
  if (pathname === "/api/openapi.json") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" }).end(
      OPENAPI_JSON_TEXT,
    );
    return;
  }
  if (pathname === "/api/openapi.yaml") {
    res.writeHead(200, { "Content-Type": "application/yaml; charset=utf-8", "Cache-Control": "public, max-age=300" }).end(
      OPENAPI_YAML_TEXT,
    );
    return;
  }
  if (pathname === "/api/docs") {
    const nonce = crypto.randomBytes(16).toString("base64");
    sendHtml(res, 200, renderApiDocsPage(nonce), nonce);
    return;
  }

  // GET /api/public/articles — public, read-only listing of published health
  // articles (the same content already public on /articles; nothing new is
  // exposed). No auth: it's a content feed, not personal/health-record data.
  // Deliberately NOT at /api/articles: that path is main's authenticated
  // publish/management CRUD API (see createArticleHandlers above) — same
  // path with two different auth models would be a real security hazard.
  if (pathname === "/api/public/articles") {
    const q = url.searchParams;
    const lang = q.get("lang") === "id" ? "id" : "en";
    const limit = Math.min(Math.max(parseInt(q.get("limit"), 10) || 10, 1), 50);
    const category = q.get("category") || null;
    const store = getArticleStore();
    const rows = store ? await store.listPublished({ limit, category }) : [];
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" }).end(
      JSON.stringify({ articles: rows.map((a) => toPublicJson(a, { publicOrigin: PUBLIC_ORIGIN, lang })) }),
    );
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
    // mcu-ORIGINAL articles are self-canonical (published_url === null), so they
    // belong in this sitemap (both languages). media_articles rows are excluded:
    // they canonical-point back to media.20fit.id and must not be indexed here.
    const articleUrls = LOCAL_ARTICLES.filter((a) => a.published_url == null)
      .map(
        (a) =>
          `<url><loc>${PUBLIC_ORIGIN}/articles/${encodeURIComponent(a.slug)}</loc><lastmod>${now}</lastmod></url>\n` +
          `<url><loc>${PUBLIC_ORIGIN}/id/articles/${encodeURIComponent(a.slug)}</loc><lastmod>${now}</lastmod></url>\n`,
      )
      .join("");
    res.writeHead(200, { "Content-Type": MIME[".xml"] }).end(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `<url><loc>${PUBLIC_ORIGIN}/</loc><lastmod>${now}</lastmod></url>\n` +
        `<url><loc>${PUBLIC_ORIGIN}/id</loc><lastmod>${now}</lastmod></url>\n` +
        `<url><loc>${PUBLIC_ORIGIN}/check-mcu</loc><lastmod>${now}</lastmod></url>\n` +
        `<url><loc>${PUBLIC_ORIGIN}/id/check-mcu</loc><lastmod>${now}</lastmod></url>\n` +
        `<url><loc>${PUBLIC_ORIGIN}/quiz</loc><lastmod>${now}</lastmod></url>\n` +
        `<url><loc>${PUBLIC_ORIGIN}/id/quiz</loc><lastmod>${now}</lastmod></url>\n` +
        `<url><loc>${PUBLIC_ORIGIN}/articles</loc><lastmod>${now}</lastmod></url>\n` +
        `<url><loc>${PUBLIC_ORIGIN}/id/articles</loc><lastmod>${now}</lastmod></url>\n` +
        articleUrls +
        `</urlset>\n`,
    );
    return;
  }

  // Root-level convenience aliases (serve straight from public/, no /public/
  // prefix) — logos in particular are referenced from the very first
  // pre-paint <script> in <head>, so they stay on the same simple,
  // well-tested path convention as styles.css rather than a nested prefix.
  const ROOT_ALIASES = { "/styles.css": "styles.css", "/logo-light.svg": "logo-light.svg", "/logo-dark.svg": "logo-dark.svg", "/universal-nav.js": "universal-nav.js" };
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

  // Homepage — the MCU experience itself (hero, quiz choices, the Scan MCU
  // widget behind the §0.1 login gate, real-program handoff, "Top 5 Articles",
  // a §0.1-safe sample result, FAQ, doctor escalation). English at /,
  // Indonesian at /id. Public; only the scan upload requires login (§0.1).
  // Local auth now owns /auth/callback (see the auth routes below); the homepage
  // no longer doubles as the SSO landing.
  if (pathname === "/") {
    const { html, nonce } = await renderHomeHub("en", "/");
    // relaxImg: Top-5 article cards carry cover photos from other https hosts.
    sendHtml(res, 200, html, nonce, { relaxImg: true });
    return;
  }
  if (pathname === "/id" || pathname === "/id/") {
    const { html, nonce } = await renderHomeHub("id", "/id");
    sendHtml(res, 200, html, nonce, { relaxImg: true });
    return;
  }
  // Legacy /home — the homepage moved to /. The SSO callback variants keep
  // RENDERING (a redirect could drop the URL fragment carrying the SSO token);
  // plain /home 301-redirects so there is one canonical URL per language.
  if (pathname === "/home/auth/callback") {
    const { html, nonce } = await renderHomeHub("en", "/");
    sendHtml(res, 200, html, nonce, { relaxImg: true });
    return;
  }
  if (pathname === "/id/home/auth/callback") {
    const { html, nonce } = await renderHomeHub("id", "/id");
    sendHtml(res, 200, html, nonce, { relaxImg: true });
    return;
  }
  if (pathname === "/home" || pathname === "/home/") {
    res.writeHead(301, { Location: "/" }).end();
    return;
  }
  if (pathname === "/id/home" || pathname === "/id/home/") {
    res.writeHead(301, { Location: "/id" }).end();
    return;
  }
  if (pathname === "/en" || pathname === "/en/" || pathname === "/en/auth/callback") {
    res.writeHead(302, { Location: pathname.replace(/^\/en/, "") || "/" }).end();
    return;
  }

  // Check MCU — the standalone Scan MCU tool page (§0.1 gate). Its /auth/callback
  // variant renders (not redirects) so the SSO fragment is consumed here, and the
  // member returns to the tool they were using.
  if (pathname === "/check-mcu" || pathname === "/check-mcu/" || pathname === "/check-mcu/auth/callback") {
    const { html, nonce } = renderCheckMcu("en", "/check-mcu");
    // relaxImg: the uploader shows a blob: preview of the chosen file.
    sendHtml(res, 200, html, nonce, { relaxImg: true });
    return;
  }
  if (pathname === "/id/check-mcu" || pathname === "/id/check-mcu/" || pathname === "/id/check-mcu/auth/callback") {
    const { html, nonce } = renderCheckMcu("id", "/id/check-mcu");
    sendHtml(res, 200, html, nonce, { relaxImg: true });
    return;
  }

  // ── Built-in auth (local — no more redirect to my.20fit for login) ───────
  if (pathname === "/login" || pathname === "/login/") {
    const { html, nonce } = wrapPage("en", "/login", renderLoginPage({ lang: "en", next: authNext(url) }));
    sendHtml(res, 200, html, nonce);
    return;
  }
  if (pathname === "/id/login" || pathname === "/id/login/") {
    const { html, nonce } = wrapPage("id", "/id/login", renderLoginPage({ lang: "id", next: authNext(url) }));
    sendHtml(res, 200, html, nonce);
    return;
  }
  if (pathname === "/register" || pathname === "/register/") {
    const { html, nonce } = wrapPage("en", "/register", renderRegisterPage({ lang: "en", next: authNext(url) }));
    sendHtml(res, 200, html, nonce);
    return;
  }
  if (pathname === "/id/register" || pathname === "/id/register/") {
    const { html, nonce } = wrapPage("id", "/id/register", renderRegisterPage({ lang: "id", next: authNext(url) }));
    sendHtml(res, 200, html, nonce);
    return;
  }
  if (pathname === "/reset-password" || pathname === "/reset-password/") {
    const { html, nonce } = wrapPage("en", "/reset-password", renderResetPage({ lang: "en" }));
    sendHtml(res, 200, html, nonce);
    return;
  }
  if (pathname === "/id/reset-password" || pathname === "/id/reset-password/") {
    const { html, nonce } = wrapPage("id", "/id/reset-password", renderResetPage({ lang: "id" }));
    sendHtml(res, 200, html, nonce);
    return;
  }
  // OAuth / email-confirm / recovery landing. The client (auth.js) redeems the
  // ?code= or #access_token here, then routes to `next` (or the uploader). Also
  // handles the SSO fragment that used to land on the homepage.
  if (pathname === "/auth/callback" || pathname === "/auth/callback/") {
    const { html, nonce } = wrapPage("en", "/auth/callback", renderCallbackPage({ lang: "en", next: authNext(url) }));
    sendHtml(res, 200, html, nonce);
    return;
  }
  if (pathname === "/id/auth/callback" || pathname === "/id/auth/callback/") {
    const { html, nonce } = wrapPage("id", "/id/auth/callback", renderCallbackPage({ lang: "id", next: authNext(url) }));
    sendHtml(res, 200, html, nonce);
    return;
  }

  // MCU history — dedicated, deep-linkable list of the member's saved scans.
  // Member-only; the list is hydrated client-side (RLS), SSR ships only the
  // shell + login gate. The /auth/callback variant renders (not redirects) so
  // an SSO return lands the member straight back on their history.
  if (pathname === "/history" || pathname === "/history/" || pathname === "/history/auth/callback") {
    const { html, nonce } = renderHistory("en", "/history");
    sendHtml(res, 200, html, nonce);
    return;
  }
  if (pathname === "/id/history" || pathname === "/id/history/" || pathname === "/id/history/auth/callback") {
    const { html, nonce } = renderHistory("id", "/id/history");
    sendHtml(res, 200, html, nonce);
    return;
  }

  // One saved scan's detail: /scan/:id and /id/scan/:id (+ SSO callback suffix).
  // The id is a Supabase row UUID; anything not matching that shape falls
  // through to 404 rather than rendering a shell for a bogus id.
  {
    const scanPath = pathname.replace(/\/auth\/callback$/, "");
    const scanMatch = scanPath.match(/^(\/id)?\/scan\/([^/]+)\/?$/);
    if (scanMatch) {
      const lang = scanMatch[1] ? "id" : "en";
      const scanId = decodeURIComponent(scanMatch[2]);
      if (/^[0-9a-fA-F-]{16,64}$/.test(scanId)) {
        const canonicalPath = (lang === "id" ? "/id/scan/" : "/scan/") + scanId;
        const { html, nonce } = renderScanDetail(lang, canonicalPath, scanId);
        sendHtml(res, 200, html, nonce);
        return;
      }
    }
  }

  // GET /api/quiz/history: member-only (Bearer token required inside the
  // handler) — the visitor's past quiz results, per spec "hasil kuis ikut
  // pindah ke akun barunya" (the list a signed-in visitor sees).
  if (pathname === "/api/quiz/history") {
    const handlers = getQuizHandlers();
    if (!handlers) {
      res.writeHead(503, { "Content-Type": "application/json" }).end(
        JSON.stringify({ ok: false, code: "service_unavailable" }),
      );
      return;
    }
    await handlers.handleHistory(req, res);
    return;
  }

  // Quiz hub (/quiz, /id/quiz) + one quiz's wizard (/quiz/<slug>,
  // /id/quiz/<slug>) — see views/quizPages.js + server/quizzes.js.
  const quizMatch = pathname.match(/^\/(?:(id)\/)?quiz(?:\/([^/]+))?\/?$/);
  if (quizMatch) {
    const quizLang = quizMatch[1] === "id" ? "id" : "en";
    const slug = quizMatch[2] ? decodeURIComponent(quizMatch[2]) : null;
    const listPath = quizLang === "id" ? "/id/quiz" : "/quiz";
    if (!slug) {
      const { html, nonce } = await renderQuizHub(quizLang, listPath);
      sendHtml(res, 200, html, nonce);
      return;
    }
    const rendered = await renderQuizDetail(quizLang, `${listPath}/${slug}`, slug);
    if (!rendered) {
      const { html, nonce } = render404(quizLang);
      sendHtml(res, 404, html, nonce);
      return;
    }
    sendHtml(res, 200, rendered.html, rendered.nonce);
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
