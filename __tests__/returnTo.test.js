import { test } from "node:test";
import assert from "node:assert/strict";
import {
  safe20fitUrl,
  isSafe20fitUrl,
  safeNextPath,
  buildLoginUrl,
} from "../src/shared/returnTo.js";

test("accepts https *.20fit.id hosts", () => {
  assert.ok(isSafe20fitUrl("https://medicalcheckup.20fit.id/"));
  assert.ok(isSafe20fitUrl("https://medicalcheckup.20fit.id/en?x=1"));
  assert.ok(isSafe20fitUrl("https://my.20fit.id/login"));
  assert.ok(isSafe20fitUrl("https://20fit.id/")); // apex
  assert.ok(isSafe20fitUrl("https://a.b.20fit.id/")); // nested sub
});

test("rejects external and look-alike hosts (open-redirect guard)", () => {
  const bad = [
    "https://evil.com",
    "https://evil.com/?x=.20fit.id",
    "https://20fit.id.evil.com/", // suffix look-alike
    "https://x.20fit.id.evil.com/", // nested look-alike
    "https://notmy20fit.id/", // no dot boundary
    "https://medicalcheckup.20fit.id.evil.com/",
    "https://medicalcheckup.20fit.id@evil.com/", // userinfo trick → host is evil.com
    "http://medicalcheckup.20fit.id/", // not https
    "ftp://medicalcheckup.20fit.id/",
    "javascript:alert(1)//20fit.id",
    "//evil.com", // protocol-relative (not absolute)
    "/local/path",
    "",
    null,
    undefined,
    12345,
  ];
  for (const v of bad) {
    assert.equal(isSafe20fitUrl(v), false, `should reject: ${String(v)}`);
    assert.equal(safe20fitUrl(v), null, `should be null: ${String(v)}`);
  }
});

test("safeNextPath only allows same-origin relative paths", () => {
  assert.equal(safeNextPath("/"), "/");
  assert.equal(safeNextPath("/en"), "/en");
  assert.equal(safeNextPath("/a/b?c=1"), "/a/b?c=1");
  assert.equal(safeNextPath("//evil.com"), "/");
  assert.equal(safeNextPath("/\\evil.com"), "/");
  assert.equal(safeNextPath("https://evil.com"), "/");
  assert.equal(safeNextPath("", "/en"), "/en");
  assert.equal(safeNextPath(null), "/");
});

test("buildLoginUrl attaches return_to only when safe", () => {
  const login = "https://my.20fit.id/login";
  assert.equal(
    buildLoginUrl(login, "https://medicalcheckup.20fit.id/"),
    "https://my.20fit.id/login?return_to=https%3A%2F%2Fmedicalcheckup.20fit.id%2F",
  );
  // external return_to is dropped, bare login returned
  assert.equal(buildLoginUrl(login, "https://evil.com/"), "https://my.20fit.id/login");
  assert.equal(buildLoginUrl(login, ""), "https://my.20fit.id/login");
});
