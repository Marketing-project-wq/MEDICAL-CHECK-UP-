import { test } from "node:test";
import assert from "node:assert/strict";
import { relatedCategories, renderRelatedArticles } from "../src/shared/relatedArticles.js";

test("relatedCategories: only flagged markers, matched by label keyword", () => {
  const metrics = [
    { label: "Kolesterol Total", status: "high" },
    { label: "Gula Darah Puasa", status: "warning" },
    { label: "Hemoglobin", status: "ok" }, // not flagged -> ignored
  ];
  const cats = relatedCategories(metrics);
  assert.ok(cats.includes("weight-management"));
  assert.ok(cats.includes("nutrition-basics"));
  assert.ok(!cats.includes(undefined));
});

test("relatedCategories: empty when nothing flagged / junk input", () => {
  assert.deepEqual(relatedCategories([{ label: "Kolesterol", status: "ok" }]), []);
  assert.deepEqual(relatedCategories(null), []);
});

test("renderRelatedArticles: real rows, localized, with a templated href", () => {
  const rows = [
    { slug: "protein-101", title: { id: "Protein 101", en: "Protein 101" }, excerpt: { id: "Ringkas", en: "Short" }, category: "nutrition-basics", read_time_minutes: 5, accent: "#2D4E8F" },
  ];
  const html = renderRelatedArticles(rows, { lang: "id", urlTemplate: "https://calorietracker.20fit.id/artikel/{slug}", heading: "Terkait", readLabel: "menit", max: 3 });
  assert.match(html, /na-related/);
  assert.match(html, /Protein 101/);
  assert.match(html, /href="https:\/\/calorietracker\.20fit\.id\/artikel\/protein-101"/);
  assert.match(html, /--na-accent:#2D4E8F/);
  assert.match(html, /5 menit/);
});

test("renderRelatedArticles: no template -> non-link card (never a broken href)", () => {
  const rows = [{ slug: "x", title: { id: "Judul" }, category: "nutrition-basics" }];
  const html = renderRelatedArticles(rows, { lang: "id", urlTemplate: "" });
  assert.match(html, /class="na-card"/);
  assert.doesNotMatch(html, /<a class="na-card"/);
});

test("renderRelatedArticles: empty/junk -> renders nothing", () => {
  assert.equal(renderRelatedArticles([], {}), "");
  assert.equal(renderRelatedArticles(null, {}), "");
  assert.equal(renderRelatedArticles([{ slug: "x" }], { urlTemplate: "u/{slug}" }), "", "no title -> skipped -> empty");
});

test("renderRelatedArticles: escapes untrusted article fields", () => {
  const rows = [{ slug: "x", title: { id: "<script>alert(1)</script>" }, category: "<b>", accent: "javascript:x" }];
  const html = renderRelatedArticles(rows, { lang: "id", urlTemplate: "https://x/{slug}", heading: "H" });
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /--na-accent:javascript/, "invalid accent dropped");
});
