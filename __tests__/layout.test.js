import { test } from "node:test";
import assert from "node:assert/strict";
import { renderLayout } from "../src/views/layout.js";
import { getStrings } from "../src/shared/i18n.js";

function render(lang) {
  return renderLayout({
    lang,
    strings: getStrings(lang),
    title: "T",
    description: "D",
    canonicalPath: lang === "id" ? "/id" : "/",
    publicOrigin: "https://medicalscanner.20fit.id",
    bodyHtml: "<main>x</main>",
    clientConfig: { apiBase: "https://my.20fit.id", lang },
    nonce: "n0nce",
    logoLightUrl: "https://x/light.svg",
    logoDarkUrl: "https://x/dark.svg",
  });
}

test("header carries a login/logout control next to the language toggle", () => {
  const html = render("en");
  assert.match(html, /data-role="header-auth"/, "header auth container");
  assert.match(html, /class="nav-login" data-role="login-cta"[^>]*>Log in \/ Sign up</, "guest login link");
  assert.match(html, /data-role="header-logout" hidden>Sign out</, "member logout, hidden until JS confirms the session");

  // Sits immediately before the language toggle (i.e. right beside it).
  const authIdx = html.indexOf('data-role="header-auth"');
  const langIdx = html.indexOf('class="lang-toggle"');
  assert.ok(authIdx > -1 && langIdx > -1 && authIdx < langIdx, "auth control precedes the lang toggle");

  // Login href falls back to the LOCAL /login (built-in auth); the client
  // refines it with a next/return_to.
  assert.match(html, /class="nav-login" data-role="login-cta" href="https:\/\/medicalscanner\.20fit\.id\/login"/, "local login href fallback");
});

test("header login control is localized (ID)", () => {
  const html = render("id");
  assert.match(html, />Masuk \/ Daftar</, "ID login label");
  assert.match(html, /data-role="header-logout" hidden>Keluar</, "ID logout label");
});
