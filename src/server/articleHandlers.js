// POST /api/articles — publish an article to medicalcheckup.20fit.id from an
// external website.
//
// Security posture:
// - Bearer token auth (ARTICLES_PUBLISH_TOKEN, a server-side secret) compared in
//   constant time. No token configured → 503 (the endpoint is inert until set).
// - Writes ONLY to this subdomain's own `mcu_articles` table via the service-role
//   key (server-side). The service-role key never ships to the browser, and a
//   caller can never target another table or org.
// - body_html is sanitized on write (defense-in-depth on top of the page CSP).
// - Best-effort in-memory rate limit; payload size capped.
//
// Isolated from the shared media_articles content pipeline by design (see the
// mcu_articles migration) — publishing here can never disturb media.20fit.id.

import crypto from "node:crypto";
import { sanitizeArticleHtml } from "../shared/sanitizeHtml.js";

const MAX_BODY_BYTES = 512 * 1024; // 512KB JSON (a generous article)
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQ = 60; // per token, per instance, per 10 min
const hits = new Map();

function isRateLimited(key) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQ) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

function bearerToken(req) {
  const h = req.headers.authorization;
  return h && h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

function timingSafeEqual(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"] || 0);
    if (declared > MAX_BODY_BYTES) {
      reject({ status: 413, code: "payload_too_large" });
      return;
    }
    const chunks = [];
    let total = 0;
    req.on("data", (c) => {
      total += c.length;
      if (total > MAX_BODY_BYTES) {
        reject({ status: 413, code: "payload_too_large" });
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject({ status: 400, code: "invalid_json" });
      }
    });
    req.on("error", () => reject({ status: 400, code: "invalid_json" }));
  });
}

// slug: lowercase ASCII words joined by single hyphens, max 80 chars. Accents
// are stripped (NFKD) so "Kolesterol" style titles produce clean slugs.
export function slugify(input) {
  return String(input || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function httpsUrl(v) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return /^https:\/\/[^\s"'<>]+$/.test(s) ? s : null;
}

function str(v, max) {
  return typeof v === "string" && v.trim().length > 0 ? v.trim().slice(0, max) : null;
}

/**
 * Validate + normalize a publish payload into a mcu_articles row.
 * @returns {{ok:true,row:object} | {ok:false,code:string}}
 */
export function validatePublish(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, code: "invalid_body" };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return { ok: false, code: "title_required" };
  if (title.length > 300) return { ok: false, code: "title_too_long" };

  const slug = body.slug ? slugify(body.slug) : slugify(title);
  if (!slug) return { ok: false, code: "invalid_slug" };

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim().slice(0, 60)).slice(0, 20)
    : null;

  const row = {
    slug,
    title: title.slice(0, 300),
    excerpt: str(body.excerpt, 500),
    body_html: typeof body.body_html === "string" && body.body_html.length > 0 ? sanitizeArticleHtml(body.body_html) : null,
    category: str(body.category, 40) || "other",
    tags,
    author_name: str(body.author_name, 120),
    meta_title: str(body.meta_title, 300),
    meta_description: str(body.meta_description, 500),
    cover_image_url: httpsUrl(body.cover_image_url),
    published_url: httpsUrl(body.published_url),
    status: "published",
    source: str(body.source, 80) || "external-api",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return { ok: true, row };
}

export function createArticleHandlers({ articleStore, publishToken, publicOrigin, hasServiceRole }) {
  async function handlePublish(req, res) {
    if (!publishToken) return sendJson(res, 503, { ok: false, code: "publish_not_configured" });
    if (!hasServiceRole) return sendJson(res, 503, { ok: false, code: "service_unavailable" });

    const token = bearerToken(req);
    if (!token || !timingSafeEqual(token, publishToken)) {
      return sendJson(res, 401, { ok: false, code: "unauthorized" });
    }
    if (isRateLimited(token.slice(0, 16))) {
      return sendJson(res, 429, { ok: false, code: "rate_limited" });
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, err.status || 400, { ok: false, code: err.code || "invalid_body" });
    }

    const v = validatePublish(body);
    if (!v.ok) return sendJson(res, 400, { ok: false, code: v.code });

    try {
      const created = await articleStore.createArticle(v.row);
      const slug = (created && created.slug) || v.row.slug;
      const base = String(publicOrigin || "").replace(/\/$/, "");
      return sendJson(res, 200, {
        ok: true,
        id: created && created.id ? created.id : null,
        slug,
        status: "published",
        url: `${base}/articles/${slug}`,
      });
    } catch (e) {
      console.error("article publish failed:", e.message);
      return sendJson(res, 502, { ok: false, code: "publish_failed" });
    }
  }

  return { handlePublish };
}
