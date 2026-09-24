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
  // Icon + a label span (the label hides on mobile via CSS → icon-only).
  assert.match(html, /data-role="login-cta"[^>]*>\s*<svg class="nav-ic"/, "login control is an icon + label");
  assert.ok(html.includes('<span class="header-label">Log in / Sign up</span>'), "login label text");
  // Signed-in state: avatar button + profile dropdown containing the logout.
  assert.ok(html.includes('data-role="nav-profile"'), "avatar/profile wrapper (hidden until signed in)");
  assert.ok(html.includes('data-act="profile-toggle"'), "avatar toggle button");
  assert.ok(html.includes('data-role="header-logout"') && html.includes(">Sign out</button>"), "logout lives in the profile dropdown");

  // Sits immediately before the language toggle (i.e. right beside it).
  const authIdx = html.indexOf('data-role="header-auth"');
  const langIdx = html.indexOf('class="lang-toggle"');
  assert.ok(authIdx > -1 && langIdx > -1 && authIdx < langIdx, "auth control precedes the lang toggle");

  // Login href is RELATIVE (/login) so it always hits the live host — never
  // the stale PUBLIC_ORIGIN domain. The client refines it with a ?next=.
  assert.match(html, /class="nav-login" data-role="login-cta" href="\/login"/, "relative login href");
});

test("header: controls-only (no page links) + mobile [More] dropdown holds lang + theme", () => {
  const html = render("en");
  // Universal controls only — the medicalscanner page links are gone from the header.
  assert.ok(!/class="nav-secondary"/.test(html), "no Home/Quiz/Articles/FAQ links in the header");
  assert.ok(!/class="nav-cta"/.test(html), "no Check MCU CTA in the header");
  // Desktop: lang + theme inline (desktop-only). Mobile: a [More] button.
  assert.match(html, /class="nav-lang desktop-only"/, "desktop language toggle");
  assert.match(html, /class="theme-toggle desktop-only"/, "desktop theme toggle");
  assert.match(html, /data-act="more-toggle"/, "mobile More button");
  assert.match(html, /data-role="more-panel"[^>]*hidden/, "More dropdown, hidden until opened");
  // The More panel itself contains a language toggle + a theme toggle.
  const panel = html.slice(html.indexOf('data-role="more-panel"'));
  assert.ok(panel.includes('class="lang-toggle"'), "More panel has the language toggle");
  assert.ok(panel.includes('class="more-item more-theme"'), "More panel has the theme toggle");
});

test("header carries the app-switcher (Products menu moved out of the black bar)", () => {
  const html = render("en");
  assert.match(html, /data-role="nav-apps"/, "app-switcher wrapper in the header");
  assert.match(html, /data-act="apps-toggle"/, "waffle toggle button");
  assert.ok(html.includes('<span class="header-label">Products</span>'), "Products label (desktop; hidden on mobile)");
  assert.match(html, /data-role="apps-panel"[^>]*hidden/, "dropdown panel, hidden until opened");
  // The black universal-nav bar is suppressed (data-no-bar); only the header switcher remains.
  assert.match(html, /src="\/universal-nav\.js" data-no-bar/, "universal-nav loaded without its own bar");
});

test("header login control is localized (ID)", () => {
  const html = render("id");
  assert.ok(html.includes('<span class="header-label">Masuk / Daftar</span>'), "ID login label");
  assert.ok(html.includes('<span class="header-label">Produk</span>'), "ID products label");
  assert.ok(html.includes(">Keluar</button>"), "ID logout in the dropdown");
});

test("profile dropdown: avatar + name/email placeholders + hub links + logout", () => {
  const html = render("id");
  assert.ok(html.includes('data-role="avatar-initial"'), "avatar initial slot(s)");
  assert.ok(html.includes('data-role="profile-name"') && html.includes('data-role="profile-email"'), "name + email slots");
  // Hub links point at my.20fit and are navigated via SSO (data-url).
  assert.ok(html.includes('data-url="https://my.20fit.id/profile"'), "Profil Saya → my.20fit/profile");
  assert.ok(html.includes('data-url="https://my.20fit.id/purchases"'), "Riwayat Pembelian → my.20fit/purchases");
  assert.ok(html.includes('data-url="https://my.20fit.id/settings"'), "Pengaturan → my.20fit/settings");
  assert.ok(html.includes(">Profil Saya<") && html.includes(">Riwayat Pembelian<") && html.includes(">Pengaturan<"), "ID hub labels");
});
