import { test } from "node:test";
import assert from "node:assert/strict";
import { createArticleStore } from "../src/server/articles.js";
import { LOCAL_ARTICLES } from "../src/shared/localArticles.js";

function fakeFetch(handler) {
  const calls = [];
  const fn = async (url, opts) => {
    calls.push({ url, opts });
    return handler(url, opts);
  };
  fn.calls = calls;
  return fn;
}
const ok = (data) => ({ ok: true, status: 200, json: async () => data });

test("listPublished queries only published rows via service-role auth", async () => {
  const fetchImpl = fakeFetch(() => ok([{ title: "A", slug: "a" }, { title: "B", slug: "b" }]));
  const store = createArticleStore({ supabaseUrl: "https://x.supabase.co", serviceRoleKey: "svc", fetchImpl });
  const rows = await store.listPublished({ limit: 30 });
  assert.ok(rows.some((r) => r.slug === "a") && rows.some((r) => r.slug === "b"), "media rows queried & included");
  const { url, opts } = fetchImpl.calls[0];
  assert.match(url, /\/rest\/v1\/media_articles\?/);
  assert.match(url, /status=eq\.published/);
  assert.match(url, /limit=30/);
  assert.equal(opts.headers.apikey, "svc");
  assert.equal(opts.headers.Authorization, "Bearer svc");
});

test("listPublished caches within TTL (second call makes no network request)", async () => {
  const fetchImpl = fakeFetch(() => ok([{ slug: "a" }]));
  const store = createArticleStore({ supabaseUrl: "https://x.supabase.co", serviceRoleKey: "svc", fetchImpl });
  await store.listPublished();
  await store.listPublished();
  assert.equal(fetchImpl.calls.length, 1, "second call served from cache");
});

test("listPublished degrades to local-only when media upstream errors (never throws)", async () => {
  const fetchImpl = fakeFetch(() => ({ ok: false, status: 500, json: async () => ({}) }));
  const store = createArticleStore({ supabaseUrl: "https://x.supabase.co", serviceRoleKey: "svc", fetchImpl });
  const rows = await store.listPublished();
  assert.deepEqual(
    rows.map((r) => r.slug),
    LOCAL_ARTICLES.map((a) => a.slug),
    "media fails gracefully → local articles still served",
  );
});

test("getBySlug filters by slug + published, returns the row or null", async () => {
  const fetchImpl = fakeFetch((url) =>
    url.includes("slug=eq.found") ? ok([{ slug: "found", body_html: "<p>x</p>" }]) : ok([]),
  );
  const store = createArticleStore({ supabaseUrl: "https://x.supabase.co", serviceRoleKey: "svc", fetchImpl });
  const found = await store.getBySlug("found");
  assert.equal(found.slug, "found");
  assert.equal(await store.getBySlug("missing"), null);
  assert.match(fetchImpl.calls[0].url, /slug=eq\.found/);
  assert.match(fetchImpl.calls[0].url, /status=eq\.published/);
});

test("getBySlug returns null for empty slug without a network call", async () => {
  const fetchImpl = fakeFetch(() => ok([]));
  const store = createArticleStore({ supabaseUrl: "https://x.supabase.co", serviceRoleKey: "svc", fetchImpl });
  assert.equal(await store.getBySlug(""), null);
  assert.equal(fetchImpl.calls.length, 0);
});

test("mcu-original (local) articles are listed FIRST, then media rows", async () => {
  const fetchImpl = fakeFetch(() => ok([{ title: "Media", slug: "media-1" }]));
  const store = createArticleStore({ supabaseUrl: "https://x.supabase.co", serviceRoleKey: "svc", fetchImpl });
  const rows = await store.listPublished({ limit: 30 });
  assert.equal(rows[0].slug, LOCAL_ARTICLES[0].slug, "a local article is first");
  assert.ok(rows.some((r) => r.slug === "media-1"), "media rows are included after");
  assert.ok(rows.length >= LOCAL_ARTICLES.length + 1);
});

test("getBySlug serves a local article without any network call, self-canonical", async () => {
  const fetchImpl = fakeFetch(() => ok([]));
  const store = createArticleStore({ supabaseUrl: "https://x.supabase.co", serviceRoleKey: "svc", fetchImpl });
  const a = await store.getBySlug(LOCAL_ARTICLES[0].slug);
  assert.equal(a.slug, LOCAL_ARTICLES[0].slug);
  assert.equal(a.published_url, null, "local article is self-canonical");
  assert.equal(fetchImpl.calls.length, 0, "no network for a local slug");
});

test("local articles are well-formed (unique slugs, body present, no scripts)", () => {
  assert.ok(LOCAL_ARTICLES.length >= 1);
  const slugs = new Set();
  for (const a of LOCAL_ARTICLES) {
    assert.ok(a.title && a.slug && a.body_html, "title/slug/body present");
    assert.equal(a.published_url, null, "self-canonical");
    assert.ok(!slugs.has(a.slug), `unique slug: ${a.slug}`);
    slugs.add(a.slug);
    assert.doesNotMatch(a.body_html, /<script/i, "no scripts in body");
  }
});
