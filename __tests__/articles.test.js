import { test } from "node:test";
import assert from "node:assert/strict";
import { createArticleStore } from "../src/server/articles.js";

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
  const rows = await store.listPublished({ limit: 5 });
  assert.equal(rows.length, 2);
  const { url, opts } = fetchImpl.calls[0];
  assert.match(url, /\/rest\/v1\/media_articles\?/);
  assert.match(url, /status=eq\.published/);
  assert.match(url, /limit=5/);
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

test("listPublished degrades to [] on upstream error (never throws)", async () => {
  const fetchImpl = fakeFetch(() => ({ ok: false, status: 500, json: async () => ({}) }));
  const store = createArticleStore({ supabaseUrl: "https://x.supabase.co", serviceRoleKey: "svc", fetchImpl });
  assert.deepEqual(await store.listPublished(), []);
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
