import { test } from "node:test";
import assert from "node:assert/strict";
import { renderLoginPage, renderRegisterPage, renderResetPage, renderCallbackPage } from "../src/views/authPages.js";

test("login page: google + email/password form + links, one h1", () => {
  const p = renderLoginPage({ lang: "en", next: "" });
  assert.match(p.title, /Log in/);
  assert.ok(p.bodyHtml.includes('data-auth-page="login"'));
  assert.ok(p.bodyHtml.includes('data-act="google"'), "google button");
  assert.ok(p.bodyHtml.includes('data-role="email"') && p.bodyHtml.includes('data-role="password"'));
  assert.ok(p.bodyHtml.includes('href="/reset-password"'), "forgot link");
  assert.ok(p.bodyHtml.includes('href="/register"'), "register link");
  assert.ok(p.bodyHtml.includes("Use your 20FIT account"), "shared-account note");
  assert.equal((p.bodyHtml.match(/<h1[ >]/g) || []).length, 1, "exactly one h1");
});

test("login page: a safe next is preserved (data-next + on the register link)", () => {
  const p = renderLoginPage({ lang: "en", next: "/check-mcu" });
  assert.ok(p.bodyHtml.includes('data-next="/check-mcu"'), "data-next carried");
  assert.ok(p.bodyHtml.includes("/register?next=%2Fcheck-mcu"), "next forwarded to register");
});

test("login page: an UNSAFE next is dropped (open-redirect guard)", () => {
  for (const bad of ["//evil.com", "https://evil.com/x", "/\\evil.com", "javascript:alert(1)"]) {
    const p = renderLoginPage({ lang: "en", next: bad });
    assert.ok(p.bodyHtml.includes('data-next=""'), `next dropped for ${bad}`);
    assert.ok(!p.bodyHtml.includes(bad), `raw unsafe next not emitted: ${bad}`);
  }
});

test("register page: consent checkbox + PDP wording + fields + login link", () => {
  const p = renderRegisterPage({ lang: "id", next: "" });
  assert.ok(p.bodyHtml.includes('data-auth-page="register"'));
  assert.ok(p.bodyHtml.includes('data-role="consent"'), "consent checkbox");
  assert.ok(p.bodyHtml.includes("UU PDP No. 27/2022"), "PDP law cited on the consent");
  assert.ok(p.bodyHtml.includes('data-role="name"') && p.bodyHtml.includes('data-role="email"') && p.bodyHtml.includes('data-role="password"'));
  assert.ok(p.bodyHtml.includes('href="/id/login"'), "ID login link");
});

test("reset page: request + set-new-password states, back link", () => {
  const p = renderResetPage({ lang: "en" });
  assert.ok(p.bodyHtml.includes('data-auth-page="reset"'));
  assert.ok(p.bodyHtml.includes('data-role="reset-request"'), "request state");
  assert.ok(p.bodyHtml.includes('data-role="reset-newpass" hidden'), "new-password state hidden by default");
  assert.ok(p.bodyHtml.includes('data-role="form-request"') && p.bodyHtml.includes('data-role="form-newpass"'));
  assert.ok(p.bodyHtml.includes('href="/login"'), "back to login");
});

test("callback page: processing shell carries next", () => {
  const p = renderCallbackPage({ lang: "en", next: "/history" });
  assert.ok(p.bodyHtml.includes('data-auth-page="callback"'));
  assert.ok(p.bodyHtml.includes('data-next="/history"'));
});

test("auth pages are localized (ID labels)", () => {
  const login = renderLoginPage({ lang: "id", next: "" });
  assert.ok(login.bodyHtml.includes('href="/id/register"') && login.bodyHtml.includes('href="/id/reset-password"'));
  assert.match(login.title, /Masuk/);
});
