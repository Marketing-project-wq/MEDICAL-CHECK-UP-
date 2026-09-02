import { test } from "node:test";
import assert from "node:assert/strict";
import { equivalentLangPath } from "../src/shared/langPref.js";

test("equivalentLangPath maps a path between default (EN) and /id", () => {
  // → ID (add /id prefix)
  assert.equal(equivalentLangPath("/", "id"), "/id");
  assert.equal(equivalentLangPath("/home", "id"), "/id/home");
  assert.equal(equivalentLangPath("/articles", "id"), "/id/articles");
  assert.equal(equivalentLangPath("/articles/ems-vs-hiit", "id"), "/id/articles/ems-vs-hiit");
  // → EN (strip /id prefix)
  assert.equal(equivalentLangPath("/id", "en"), "/");
  assert.equal(equivalentLangPath("/id/home", "en"), "/home");
  assert.equal(equivalentLangPath("/id/articles/ems-vs-hiit", "en"), "/articles/ems-vs-hiit");
  // same-language target is a no-op
  assert.equal(equivalentLangPath("/home", "en"), "/home");
  assert.equal(equivalentLangPath("/id/home", "id"), "/id/home");
});
