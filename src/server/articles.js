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

const LIST_COLS = "title,slug,excerpt,category,persona,meta_description,published_at,published_url";
const ONE_COLS =
  "title,slug,body_html,meta_title,meta_description,excerpt,category,tags,author_name,published_at,published_url";

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

  // mcu-original drafts are listed FIRST, then the media_articles rows.
  async function listPublished({ limit = 30, category = null } = {}) {
    const local = LOCAL_ARTICLES.filter((a) => !category || a.category === category);
    const media = await listMedia({ limit, category });
    return [...local, ...media].slice(0, limit);
  }

  async function listMedia({ limit = 30, category = null } = {}) {
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

  return { listPublished, getBySlug };
}
