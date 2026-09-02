import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeArticleHtml } from "../src/shared/sanitizeHtml.js";

test("keeps ordinary article markup untouched", () => {
  const html =
    '<p>Hello</p><h2>Sub</h2><ul><li>a</li></ul><img src="https://media.20fit.id/x.jpg" alt="x"><a href="https://media.20fit.id/y">y</a>';
  const out = sanitizeArticleHtml(html);
  assert.match(out, /<p>Hello<\/p>/);
  assert.match(out, /<h2>Sub<\/h2>/);
  assert.match(out, /<img src="https:\/\/media\.20fit\.id\/x\.jpg"/);
  assert.match(out, /<a href="https:\/\/media\.20fit\.id\/y">y<\/a>/);
});

test("removes <script> blocks and their contents", () => {
  const out = sanitizeArticleHtml("<p>ok</p><script>alert(1)</script><p>end</p>");
  assert.doesNotMatch(out, /<script/i);
  assert.doesNotMatch(out, /alert\(1\)/);
  assert.match(out, /<p>ok<\/p>/);
  assert.match(out, /<p>end<\/p>/);
});

test("removes style/iframe/object/embed/form blocks", () => {
  for (const tag of ["style", "iframe", "object", "embed", "form"]) {
    const out = sanitizeArticleHtml(`<p>a</p><${tag}>evil</${tag}><p>b</p>`);
    assert.doesNotMatch(out, new RegExp(`<${tag}`, "i"), `${tag} removed`);
  }
});

test("strips inline event-handler attributes", () => {
  const out = sanitizeArticleHtml("<img src=\"x.jpg\" onerror=\"alert(1)\"><div onclick='x()'>a</div>");
  assert.doesNotMatch(out, /onerror/i);
  assert.doesNotMatch(out, /onclick/i);
});

test("neutralizes javascript: URLs", () => {
  const out = sanitizeArticleHtml('<a href="javascript:alert(1)">x</a>');
  assert.doesNotMatch(out, /javascript:/i);
  assert.match(out, /href="#"/);
});

test("handles empty / non-string input", () => {
  assert.equal(sanitizeArticleHtml(""), "");
  assert.equal(sanitizeArticleHtml(null), "");
  assert.equal(sanitizeArticleHtml(undefined), "");
});
