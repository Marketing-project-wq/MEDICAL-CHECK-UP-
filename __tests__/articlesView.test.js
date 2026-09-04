import { test } from "node:test";
import assert from "node:assert/strict";
import { articleListPage, articleDetailPage, articlePath } from "../src/views/articles.js";
import { getStrings } from "../src/shared/i18n.js";

const sEn = getStrings("en");
const sId = getStrings("id");

test("articlePath builds language-correct URLs", () => {
  assert.equal(articlePath("en"), "/articles");
  assert.equal(articlePath("id"), "/id/articles");
  assert.equal(articlePath("en", "my-slug"), "/articles/my-slug");
  assert.equal(articlePath("id", "my-slug"), "/id/articles/my-slug");
});

test("list page renders cards + disclaimer, and an empty state when none", () => {
  const page = articleListPage({
    s: sEn,
    lang: "en",
    articles: [{ title: "HYROX tips", slug: "hyrox-tips", excerpt: "Do this", category: "hyrox", published_at: "2026-08-01" }],
  });
  assert.match(page.bodyHtml, /article-card/);
  assert.match(page.bodyHtml, /HYROX tips/);
  assert.match(page.bodyHtml, /href="\/articles\/hyrox-tips"/);
  assert.match(page.bodyHtml, /health-disclaimer/);
  const empty = articleListPage({ s: sEn, lang: "en", articles: [] });
  assert.match(empty.bodyHtml, /No articles/);
});

test("detail page: canonical = published_url; disclaimer + doctor CTA present; body sanitized", () => {
  const page = articleDetailPage({
    s: sEn,
    lang: "en",
    bookingUrl: "https://my.20fit.id/book-doctor",
    article: {
      title: "EMS vs HIIT",
      slug: "ems-vs-hiit",
      body_html: "<p>Body</p><script>alert(1)</script>",
      published_url: "https://media.20fit.id/ems-vs-hiit",
      category: "ems",
      published_at: "2026-08-01",
      meta_description: "d",
    },
  });
  assert.equal(page.canonical, "https://media.20fit.id/ems-vs-hiit");
  assert.match(page.bodyHtml, /health-disclaimer/);
  assert.match(page.bodyHtml, /doctor-cta/);
  assert.match(page.bodyHtml, /book-doctor/);
  assert.match(page.bodyHtml, /<p>Body<\/p>/);
  assert.doesNotMatch(page.bodyHtml, /<script/i);
  assert.match(page.bodyHtml, /media\.20fit\.id\/ems-vs-hiit/); // source link
});

test("EN site overlays an article's `en` translation; ID site keeps Indonesian", () => {
  const art = {
    title: "Judul ID", slug: "x", excerpt: "Ringkasan ID", meta_description: "Meta ID",
    body_html: "<p>Isi Indonesia</p>", published_url: null, category: "edukasi",
    en: { title: "EN Title", excerpt: "EN summary", meta_description: "EN meta", body_html: "<p>English body</p>" },
  };
  const en = articleDetailPage({ s: sEn, lang: "en", article: art, bookingUrl: "#" });
  assert.match(en.bodyHtml, /EN Title/);
  assert.match(en.bodyHtml, /English body/);
  assert.doesNotMatch(en.bodyHtml, /Judul ID/);
  const id = articleDetailPage({ s: sId, lang: "id", article: art, bookingUrl: "#" });
  assert.match(id.bodyHtml, /Judul ID/);
  assert.match(id.bodyHtml, /Isi Indonesia/);
  assert.doesNotMatch(id.bodyHtml, /EN Title/);
  const enList = articleListPage({ s: sEn, lang: "en", articles: [art] });
  assert.match(enList.bodyHtml, /EN Title/);
  assert.doesNotMatch(enList.bodyHtml, /Judul ID/);
});

test("detail page escapes an untrusted title (no HTML injection)", () => {
  const page = articleDetailPage({
    s: sId,
    lang: "id",
    bookingUrl: "#",
    article: { title: "<img src=x onerror=alert(1)>", slug: "x", body_html: "<p>ok</p>", published_url: null },
  });
  assert.doesNotMatch(page.bodyHtml, /<img src=x onerror/);
  assert.match(page.bodyHtml, /&lt;img/);
  assert.equal(page.canonical, null);
});
