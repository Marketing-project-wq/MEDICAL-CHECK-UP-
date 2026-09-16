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
    status: body.status === "draft" ? "draft" : "published",
    source: str(body.source, 80) || "external-api",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return { ok: true, row };
}

/**
 * Build a PARTIAL update (only the keys present in `body`) for PATCH.
 * @returns {{ok:true,patch:object} | {ok:false,code:string}}
 */
export function buildPatch(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, code: "invalid_body" };
  const patch = {};
  if ("title" in body) {
    const t = typeof body.title === "string" ? body.title.trim() : "";
    if (!t) return { ok: false, code: "title_required" };
    patch.title = t.slice(0, 300);
  }
  if ("slug" in body) {
    const s = slugify(body.slug);
    if (!s) return { ok: false, code: "invalid_slug" };
    patch.slug = s;
  }
  if ("status" in body) {
    if (body.status !== "draft" && body.status !== "published") return { ok: false, code: "invalid_status" };
    patch.status = body.status;
  }
  if ("excerpt" in body) patch.excerpt = str(body.excerpt, 500);
  if ("body_html" in body)
    patch.body_html = typeof body.body_html === "string" && body.body_html.length > 0 ? sanitizeArticleHtml(body.body_html) : null;
  if ("category" in body) patch.category = str(body.category, 40) || "other";
  if ("tags" in body)
    patch.tags = Array.isArray(body.tags)
      ? body.tags.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim().slice(0, 60)).slice(0, 20)
      : null;
  if ("author_name" in body) patch.author_name = str(body.author_name, 120);
  if ("meta_title" in body) patch.meta_title = str(body.meta_title, 300);
  if ("meta_description" in body) patch.meta_description = str(body.meta_description, 500);
  if ("cover_image_url" in body) patch.cover_image_url = httpsUrl(body.cover_image_url);
  if ("published_url" in body) patch.published_url = httpsUrl(body.published_url);
  if (Object.keys(patch).length === 0) return { ok: false, code: "empty_patch" };
  patch.updated_at = new Date().toISOString();
  return { ok: true, patch };
}

export function createArticleHandlers({ articleStore, publishToken, publicOrigin, hasServiceRole }) {
  const base = String(publicOrigin || "").replace(/\/$/, "");
  const withUrl = (r) => (r && r.slug ? { ...r, url: `${base}/articles/${r.slug}` } : r);

  // Shared gate for every /api/articles method: configured + authed + not rate
  // limited. Returns the token on success; otherwise it has already responded.
  function guard(req, res) {
    if (!publishToken) {
      sendJson(res, 503, { ok: false, code: "publish_not_configured" });
      return null;
    }
    if (!hasServiceRole) {
      sendJson(res, 503, { ok: false, code: "service_unavailable" });
      return null;
    }
    const token = bearerToken(req);
    if (!token || !timingSafeEqual(token, publishToken)) {
      sendJson(res, 401, { ok: false, code: "unauthorized" });
      return null;
    }
    if (isRateLimited(token.slice(0, 16))) {
      sendJson(res, 429, { ok: false, code: "rate_limited" });
      return null;
    }
    return token;
  }
  // POST /api/articles — create or update (upsert on slug).
  async function handlePublish(req, res) {
    if (!guard(req, res)) return;
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
      return sendJson(res, 200, {
        ok: true,
        id: created && created.id ? created.id : null,
        slug,
        status: v.row.status,
        url: `${base}/articles/${slug}`,
      });
    } catch (e) {
      console.error("article publish failed:", e.message);
      return sendJson(res, 502, { ok: false, code: "publish_failed" });
    }
  }

  // GET /api/articles?status=all|draft|published&limit=&offset= — list.
  async function handleList(req, res) {
    if (!guard(req, res)) return;
    const params = new URL(req.url, "http://localhost").searchParams;
    const status = params.get("status") || "all";
    if (!["all", "draft", "published"].includes(status)) return sendJson(res, 400, { ok: false, code: "invalid_status" });
    const limit = Math.min(Math.max(parseInt(params.get("limit") || "50", 10) || 50, 1), 200);
    const offset = Math.max(parseInt(params.get("offset") || "0", 10) || 0, 0);
    try {
      const rows = await articleStore.listArticlesAdmin({ status, limit, offset });
      return sendJson(res, 200, { ok: true, count: rows.length, articles: rows.map(withUrl) });
    } catch (e) {
      console.error("article list failed:", e.message);
      return sendJson(res, 502, { ok: false, code: "list_failed" });
    }
  }

  // GET /api/articles/:slug — read one (any status), full body.
  async function handleGetOne(req, res, slug) {
    if (!guard(req, res)) return;
    try {
      const article = await articleStore.getArticleAdmin(slug);
      if (!article) return sendJson(res, 404, { ok: false, code: "not_found" });
      return sendJson(res, 200, { ok: true, article: withUrl(article) });
    } catch (e) {
      console.error("article get failed:", e.message);
      return sendJson(res, 502, { ok: false, code: "get_failed" });
    }
  }

  // PATCH /api/articles/:slug — partial update (only the fields sent).
  async function handleUpdate(req, res, slug) {
    if (!guard(req, res)) return;
    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, err.status || 400, { ok: false, code: err.code || "invalid_body" });
    }
    const v = buildPatch(body);
    if (!v.ok) return sendJson(res, 400, { ok: false, code: v.code });
    try {
      const updated = await articleStore.updateArticle(slug, v.patch);
      if (!updated) return sendJson(res, 404, { ok: false, code: "not_found" });
      return sendJson(res, 200, { ok: true, article: withUrl(updated) });
    } catch (e) {
      console.error("article update failed:", e.message);
      return sendJson(res, 502, { ok: false, code: "update_failed" });
    }
  }

  // DELETE /api/articles/:slug — remove the article.
  async function handleDelete(req, res, slug) {
    if (!guard(req, res)) return;
    try {
      const n = await articleStore.deleteArticle(slug);
      if (!n) return sendJson(res, 404, { ok: false, code: "not_found" });
      return sendJson(res, 200, { ok: true, deleted: slug });
    } catch (e) {
      console.error("article delete failed:", e.message);
      return sendJson(res, 502, { ok: false, code: "delete_failed" });
    }
  }

  return { handlePublish, handleList, handleGetOne, handleUpdate, handleDelete };
}
