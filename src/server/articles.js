// Server-side reader for 20FIT health articles (public.media_articles),
// rendered SSR on mcu.20fit.id so search engines see the content and the
// visitor never has to leave for media.20fit.id to read it.
//
// - Only status='published' rows are ever exposed.
// - Read with the SERVICE-ROLE key SERVER-SIDE only (media_articles has RLS
//   enabled with no public policy; the key never ships to the browser).
// - Each mcu article page canonical-points back to the media.20fit original
//   (published_url) so mcu displays the content without competing with
//   media.20fit for the same keywords (anti-cannibalization).
// - A short in-memory TTL cache keeps this off Supabase on every page view.
// - Any error degrades to empty list / null (→ empty state / 404), never a 500.
// Dependency-free ESM (Node built-in fetch).

import { LOCAL_ARTICLES } from "../shared/localArticles.js";
import { photoUrl } from "../shared/articleCover.js";

// media_assets(url) is an embedded resource via the cover_asset_id FK — only
// used by the JSON API (toPublicJson below); the SSR pages don't read it, so
// adding it here is additive and doesn't change existing page rendering.
const LIST_COLS = "title,slug,excerpt,category,persona,meta_description,published_at,published_url,media_assets(url)";
const ONE_COLS =
  "title,slug,body_html,meta_title,meta_description,excerpt,category,tags,author_name,published_at,published_url";
// mcu_articles: this subdomain's OWN article table (published via /api/articles),
// isolated from the shared media_articles pipeline. `cover_image_url` maps to the
// article object's `image` so the cover renderer uses it.
const MCU_LIST_COLS = "title,slug,excerpt,category,author_name,published_at,published_url,cover_image_url";
const MCU_ONE_COLS =
  "title,slug,excerpt,category,author_name,published_at,published_url,cover_image_url,body_html,meta_title,meta_description,tags";
// Management (publish API) reads: include id/status/timestamps, any status.
const MCU_ADMIN_LIST_COLS =
  "id,slug,title,excerpt,category,tags,author_name,status,source,published_url,published_at,created_at,updated_at";
const MCU_ADMIN_ONE_COLS = MCU_ADMIN_LIST_COLS + ",body_html,meta_title,meta_description,cover_image_url";

// Normalizes either a LOCAL_ARTICLES entry or a media_articles row into the
// shape served by GET /api/articles — see server.js for the route. Never
// includes body_html/tags/etc: this is a listing feed, not the full article.
export function toPublicJson(a, { publicOrigin, lang }) {
  const listPath = lang === "id" ? "/id/articles" : "/articles";
  return {
    title: a.title || "",
    slug: a.slug || "",
    excerpt: a.excerpt || "",
    category: a.category || null,
    cover_image_url: photoUrl(a) || (a.media_assets && a.media_assets.url) || null,
    published_at: a.published_at || null,
    url: a.published_url || `${publicOrigin}${listPath}/${encodeURIComponent(a.slug || "")}`,
  };
}

export function createArticleStore({ supabaseUrl, serviceRoleKey, ttlMs = 5 * 60 * 1000, fetchImpl = fetch }) {
  const restBase = `${String(supabaseUrl).replace(/\/$/, "")}/rest/v1`;
  const cache = new Map();

  function getCached(key) {
    const e = cache.get(key);
    return e && Date.now() - e.at < ttlMs ? e.data : undefined;
  }
  function setCached(key, data) {
    cache.set(key, { at: Date.now(), data });
    return data;
  }

  async function rest(pathAndQuery) {
    const res = await fetchImpl(`${restBase}${pathAndQuery}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`media_articles REST ${res.status}`);
    return res.json();
  }

  // mcu-original drafts FIRST, then this subdomain's own mcu_articles, then the
  // shared media_articles rows.
  async function listPublished({ limit = 30, category = null } = {}) {
    const local = LOCAL_ARTICLES.filter((a) => !category || a.category === category);
    const [mcu, media] = await Promise.all([listMcu({ limit, category }), listMedia({ limit, category })]);
    return [...local, ...mcu, ...media].slice(0, limit);
  }

  function mapMcuRow(r) {
    // `cover_image_url` → `image` (the field the cover renderer reads); a null
    // cover just falls back to the generated cover, same as any other article.
    return r && r.cover_image_url ? { ...r, image: r.cover_image_url } : { ...r };
  }

  async function listMcu({ limit = 30, category = null } = {}) {
    if (!serviceRoleKey) return [];
    const key = `mcu:${category || "all"}:${limit}`;
    const hit = getCached(key);
    if (hit !== undefined) return hit;
    try {
      let q = `/mcu_articles?status=eq.published&select=${MCU_LIST_COLS}&order=published_at.desc.nullslast&limit=${limit}`;
      if (category) q += `&category=eq.${encodeURIComponent(category)}`;
      const rows = await rest(q);
      return setCached(key, Array.isArray(rows) ? rows.map(mapMcuRow) : []);
    } catch (e) {
      console.error("articles.listMcu failed:", e.message);
      return []; // graceful empty — never 500 the page
    }
  }

  async function getMcuBySlug(slug) {
    if (!serviceRoleKey) return null;
    const key = `mcu-slug:${slug}`;
    const hit = getCached(key);
    if (hit !== undefined) return hit;
    try {
      const rows = await rest(
        `/mcu_articles?status=eq.published&slug=eq.${encodeURIComponent(slug)}&select=${MCU_ONE_COLS}&limit=1`,
      );
      const row = Array.isArray(rows) && rows[0] ? mapMcuRow(rows[0]) : null;
      return setCached(key, row);
    } catch (e) {
      console.error("articles.getMcuBySlug failed:", e.message);
      return null;
    }
  }

  // Upsert an article into mcu_articles (unique slug). Used by the /api/articles
  // publish endpoint. Requires the service-role key (server-side only).
  async function createArticle(row) {
    if (!serviceRoleKey) throw new Error("no_service_role");
    const res = await fetchImpl(`${restBase}/mcu_articles?on_conflict=slug`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify([row]),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`mcu_articles upsert ${res.status}: ${text.slice(0, 200)}`);
    }
    const rows = await res.json().catch(() => []);
    cache.clear(); // the new/updated article must show on the next page view
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  }

  async function listMedia({ limit = 30, category = null } = {}) {
    // No service-role key → skip the media_articles fetch entirely (the
    // mcu-original local articles still render). Avoids a doomed request with
    // an empty apikey when Supabase env isn't configured.
    if (!serviceRoleKey) return [];
    const key = `list:${category || "all"}:${limit}`;
    const hit = getCached(key);
    if (hit !== undefined) return hit;
    try {
      let q = `/media_articles?status=eq.published&select=${LIST_COLS}&order=published_at.desc.nullslast&limit=${limit}`;
      if (category) q += `&category=eq.${encodeURIComponent(category)}`;
      const rows = await rest(q);
      return setCached(key, Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("articles.listMedia failed:", e.message);
      return []; // graceful empty — never 500 the page
    }
  }

  async function getBySlug(slug) {
    if (typeof slug !== "string" || slug.length === 0) return null;
    const local = LOCAL_ARTICLES.find((a) => a.slug === slug);
    if (local) return local;
    const mcu = await getMcuBySlug(slug);
    if (mcu) return mcu;
    const key = `slug:${slug}`;
    const hit = getCached(key);
    if (hit !== undefined) return hit;
    try {
      const rows = await rest(
        `/media_articles?status=eq.published&slug=eq.${encodeURIComponent(slug)}&select=${ONE_COLS}&limit=1`,
      );
      const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
      return setCached(key, row);
    } catch (e) {
      console.error("articles.getBySlug failed:", e.message);
      return null;
    }
  }

  // ── Management reads/writes (publish API; any status, uncached) ──────────
  const svcHeaders = () => ({ apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` });

  async function listArticlesAdmin({ status = "all", limit = 50, offset = 0 } = {}) {
    if (!serviceRoleKey) return [];
    let q = `/mcu_articles?select=${MCU_ADMIN_LIST_COLS}&order=updated_at.desc&limit=${limit}&offset=${offset}`;
    if (status && status !== "all") q += `&status=eq.${encodeURIComponent(status)}`;
    const rows = await rest(q);
    return Array.isArray(rows) ? rows : [];
  }

  async function getArticleAdmin(slug) {
    if (!serviceRoleKey) return null;
    const rows = await rest(`/mcu_articles?slug=eq.${encodeURIComponent(slug)}&select=${MCU_ADMIN_ONE_COLS}&limit=1`);
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  }

  async function updateArticle(slug, patch) {
    if (!serviceRoleKey) throw new Error("no_service_role");
    const res = await fetchImpl(`${restBase}/mcu_articles?slug=eq.${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { ...svcHeaders(), "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`mcu_articles patch ${res.status}: ${t.slice(0, 200)}`);
    }
    const rows = await res.json().catch(() => []);
    cache.clear();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  }

  async function deleteArticle(slug) {
    if (!serviceRoleKey) throw new Error("no_service_role");
    const res = await fetchImpl(`${restBase}/mcu_articles?slug=eq.${encodeURIComponent(slug)}`, {
      method: "DELETE",
      headers: { ...svcHeaders(), Prefer: "return=representation" },
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`mcu_articles delete ${res.status}: ${t.slice(0, 200)}`);
    }
    const rows = await res.json().catch(() => []);
    cache.clear();
    return Array.isArray(rows) ? rows.length : 0;
  }

  return { listPublished, getBySlug, createArticle, listArticlesAdmin, getArticleAdmin, updateArticle, deleteArticle };
}
