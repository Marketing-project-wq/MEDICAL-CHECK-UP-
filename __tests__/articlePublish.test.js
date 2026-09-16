import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { slugify, validatePublish, createArticleHandlers } from "../src/server/articleHandlers.js";

test("slugify: clean, ascii, hyphenated, bounded", () => {
  assert.equal(slugify("Memahami Profil Lipid (Kolesterol)"), "memahami-profil-lipid-kolesterol");
  assert.equal(slugify("  Gula   Darah  "), "gula-darah");
  assert.equal(slugify("Ürïnalisis & Tés"), "urinalisis-tes");
  assert.equal(slugify("!!!"), "");
  assert.equal(slugify("a".repeat(200)).length, 80);
});

test("validatePublish: requires a title", () => {
  assert.equal(validatePublish({}).code, "title_required");
  assert.equal(validatePublish({ title: "   " }).code, "title_required");
  assert.equal(validatePublish(null).code, "invalid_body");
});

test("validatePublish: derives slug, defaults category, caps tags", () => {
  const v = validatePublish({ title: "Cara Membaca Hasil Lab", tags: ["a", "b", 3, "c"], });
  assert.ok(v.ok);
  assert.equal(v.row.slug, "cara-membaca-hasil-lab");
  assert.equal(v.row.category, "other");
  assert.deepEqual(v.row.tags, ["a", "b", "c"]);
  assert.equal(v.row.status, "published");
  assert.equal(v.row.source, "external-api");
});

test("validatePublish: sanitizes body_html and validates https URLs", () => {
  const v = validatePublish({
    title: "T",
    body_html: '<p>ok</p><script>alert(1)</script><img src="x" onerror="bad()">',
    cover_image_url: "https://cdn.example/x.jpg",
    published_url: "javascript:alert(1)",
  });
  assert.ok(v.ok);
  assert.doesNotMatch(v.row.body_html, /<script/i, "script stripped");
  assert.doesNotMatch(v.row.body_html, /onerror/i, "event handler stripped");
  assert.equal(v.row.cover_image_url, "https://cdn.example/x.jpg");
  assert.equal(v.row.published_url, null, "non-https rejected");
});

// ── handler ──────────────────────────────────────────────────────────────
function mockReq({ headers = {}, body = "" }) {
  const req = new EventEmitter();
  req.headers = headers;
  req.destroy = () => {};
  process.nextTick(() => {
    if (body) req.emit("data", Buffer.from(body));
    req.emit("end");
  });
  return req;
}
function mockRes() {
  const res = { statusCode: 0, body: "" };
  res.writeHead = (s) => {
    res.statusCode = s;
    return res;
  };
  res.end = (b) => {
    res.body = b || "";
  };
  return res;
}
const jsonHeaders = (token) => ({
  ...(token ? { authorization: `Bearer ${token}` } : {}),
  "content-type": "application/json",
});

test("handlePublish: 503 when not configured (no token / no service role)", async () => {
  const noToken = createArticleHandlers({ articleStore: {}, publishToken: "", publicOrigin: "https://x", hasServiceRole: true });
  let res = mockRes();
  await noToken.handlePublish(mockReq({ headers: jsonHeaders("t") }), res);
  assert.equal(res.statusCode, 503);
  assert.match(res.body, /publish_not_configured/);

  const noKey = createArticleHandlers({ articleStore: {}, publishToken: "secret", publicOrigin: "https://x", hasServiceRole: false });
  res = mockRes();
  await noKey.handlePublish(mockReq({ headers: jsonHeaders("secret") }), res);
  assert.equal(res.statusCode, 503);
  assert.match(res.body, /service_unavailable/);
});

test("handlePublish: 401 on missing/wrong token", async () => {
  const h = createArticleHandlers({ articleStore: {}, publishToken: "secret", publicOrigin: "https://x", hasServiceRole: true });
  let res = mockRes();
  await h.handlePublish(mockReq({ headers: { "content-type": "application/json" } }), res);
  assert.equal(res.statusCode, 401);
  res = mockRes();
  await h.handlePublish(mockReq({ headers: jsonHeaders("wrong") }), res);
  assert.equal(res.statusCode, 401);
});

test("handlePublish: 200 happy path upserts a sanitized row and returns the URL", async () => {
  let captured = null;
  const articleStore = {
    async createArticle(row) {
      captured = row;
      return { id: "id-123", slug: row.slug };
    },
  };
  const h = createArticleHandlers({ articleStore, publishToken: "secret", publicOrigin: "https://medicalcheckup.20fit.id/", hasServiceRole: true });
  const res = mockRes();
  await h.handlePublish(
    mockReq({
      headers: jsonHeaders("secret"),
      body: JSON.stringify({ title: "Judul Uji", body_html: "<p>hai</p><script>x()</script>", category: "nutrition" }),
    }),
    res,
  );
  assert.equal(res.statusCode, 200);
  const out = JSON.parse(res.body);
  assert.equal(out.ok, true);
  assert.equal(out.slug, "judul-uji");
  assert.equal(out.url, "https://medicalcheckup.20fit.id/articles/judul-uji");
  assert.equal(captured.category, "nutrition");
  assert.doesNotMatch(captured.body_html, /<script/i);
});

test("handlePublish: 400 when title missing", async () => {
  const h = createArticleHandlers({ articleStore: {}, publishToken: "secret", publicOrigin: "https://x", hasServiceRole: true });
  const res = mockRes();
  await h.handlePublish(mockReq({ headers: jsonHeaders("secret"), body: JSON.stringify({ body_html: "<p>x</p>" }) }), res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /title_required/);
});
