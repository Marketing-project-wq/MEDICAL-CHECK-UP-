// medicalcheckup.20fit.id — zero-dependency Node HTTP server.
// Serves server-rendered educational pages (SEO), the example analysis, static
// assets, and the browser client. No AI, no file storage, no service keys here.

import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

import { renderLayout } from "./views/layout.js";
import { renderHomePage } from "./views/pages.js";
import { getStrings } from "./shared/i18n.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const SRC_DIR = __dirname;

const PORT = Number(process.env.PORT) || 3000;
const MY20FIT_ORIGIN = (process.env.MY20FIT_ORIGIN || "https://my.20fit.id").replace(/\/$/, "");
const SUPABASE_URL = (process.env.SUPABASE_URL || "https://cpvzwqptzcxnwzfzgrmt.supabase.co").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || "https://medicalcheckup.20fit.id").replace(/\/$/, "");

const supabaseOrigin = safeOrigin(SUPABASE_URL);

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
  { prefix: "/public/", dir: PUBLIC_DIR },
];

function securityHeaders(nonce) {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' " + MY20FIT_ORIGIN,
    "img-src 'self' data: blob:",
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
  };
}

function sendHtml(res, status, html, nonce) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, max-age=300",
    ...securityHeaders(nonce),
  });
  res.end(html);
}

function renderPage(lang, canonicalPath) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const page = renderHomePage({
    lang,
    publicOrigin: PUBLIC_ORIGIN,
    loginUrl: MY20FIT_ORIGIN + "/login",
    canonicalPath,
  });
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
  });
  return { html, nonce };
}

function strings(lang) {
  return getStrings(lang);
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
        `<url><loc>${PUBLIC_ORIGIN}/en</loc><lastmod>${now}</lastmod></url>\n` +
        `</urlset>\n`,
    );
    return;
  }

  // styles.css convenience alias
  if (pathname === "/styles.css") {
    try {
      const css = await readFile(path.join(PUBLIC_DIR, "styles.css"));
      res.writeHead(200, {
        "Content-Type": MIME[".css"],
        "Cache-Control": "public, max-age=600",
      });
      res.end(css);
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

  // Pages (Indonesian default, English at /en). /auth/callback shares the ID
  // page — the client handles the SSO fragment on load, then continues here.
  if (pathname === "/" || pathname === "/auth/callback") {
    const { html, nonce } = renderPage("id", "/");
    sendHtml(res, 200, html, nonce);
    return;
  }
  if (pathname === "/en" || pathname === "/en/" || pathname === "/en/auth/callback") {
    const { html, nonce } = renderPage("en", "/en");
    sendHtml(res, 200, html, nonce);
    return;
  }

  // 404
  const lang = pathname.startsWith("/en") ? "en" : "id";
  const nonce = crypto.randomBytes(16).toString("base64");
  const s = strings(lang);
  const body = `<section class="section"><div class="wrap"><h1>404</h1><p>${
    lang === "en" ? "Page not found." : "Halaman tidak ditemukan."
  }</p><p><a href="${lang === "en" ? "/en" : "/"}">${escapeHome(lang)}</a></p></div></section>`;
  const html = renderLayout({
    lang,
    strings: s,
    title: "404 — " + s.brand,
    description: "",
    canonicalPath: lang === "en" ? "/en" : "/",
    publicOrigin: PUBLIC_ORIGIN,
    bodyHtml: body,
    clientConfig: clientConfig(lang),
    nonce,
  });
  sendHtml(res, 404, html, nonce);
});

function escapeHome(lang) {
  return lang === "en" ? "Back to home" : "Kembali ke beranda";
}

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `medicalcheckup subdomain listening on :${PORT} — api=${MY20FIT_ORIGIN} supabase=${supabaseOrigin} anonKey=${
      SUPABASE_ANON_KEY ? "set" : "MISSING"
    }`,
  );
});

export default server;
