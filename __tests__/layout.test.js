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
  // Logged-out CTA is now a text-only "Sign Up" button → the register page
  // (calorietracker style); existing users reach login from there.
  assert.match(html, /<a class="nav-signup" data-role="login-cta" href="\/register">Sign Up<\/a>/, "Sign Up CTA → register");
  // Signed-in state: avatar button + profile dropdown containing the logout.
  assert.ok(html.includes('data-role="nav-profile"'), "avatar/profile wrapper (hidden until signed in)");
  assert.ok(html.includes('data-act="profile-toggle"'), "avatar toggle button");
  assert.ok(html.includes('data-role="header-logout"') && html.includes(">Sign out</button>"), "logout lives in the profile dropdown");

  // Sits immediately before the language toggle (i.e. right beside it).
  const authIdx = html.indexOf('data-role="header-auth"');
  const langIdx = html.indexOf('class="lang-toggle"');
  assert.ok(authIdx > -1 && langIdx > -1 && authIdx < langIdx, "auth control precedes the lang toggle");

  // Href is RELATIVE (/register) so it always hits the live host; the client
  // refines it with the current lang + a safe ?next=.
  assert.match(html, /class="nav-signup" data-role="login-cta" href="\/register"/, "relative register href");
});

test("header: page tabs on the left + universal controls on the right; mobile [More] holds tabs + lang + theme", () => {
  const html = render("en");
  // No legacy page-link styles — the SCAN/HISTORY tabs are .nav-tab, not these.
  assert.ok(!/class="nav-secondary"/.test(html), "no old Home/Quiz/Articles/FAQ links");
  assert.ok(!/class="nav-cta"/.test(html), "no Check MCU CTA pill in the header");
  // Left side: the product page tabs (desktop) — SCAN + HISTORY.
  assert.match(html, /class="nav-tabs desktop-only" data-role="header-tabs"/, "desktop page-tabs nav");
  assert.match(html, /class="nav-tab[^"]*" href="\/medical" data-tab="scan"[^>]*>Scan</, "SCAN tab → /medical");
  assert.match(html, /class="nav-tab[^"]*" href="\/medical#history" data-tab="history"[^>]*>History</, "HISTORY tab → /medical#history");
  // Right side: theme + lang inline on desktop; a [More] button on mobile.
  assert.match(html, /class="nav-lang desktop-only"/, "desktop language toggle");
  assert.match(html, /class="theme-toggle desktop-only"/, "desktop theme toggle");
  assert.match(html, /data-act="more-toggle"/, "mobile More button");
  assert.match(html, /data-role="more-panel"[^>]*hidden/, "More dropdown, hidden until opened");
  // The More panel holds the page tabs + a language toggle + a theme toggle.
  const panel = html.slice(html.indexOf('data-role="more-panel"'));
  assert.ok(/data-role="more-tabs"/.test(panel), "More panel has the page-tabs section");
  assert.ok(/class="more-tab[^"]*" href="\/medical#history" data-tab="history"/.test(panel), "More panel HISTORY tab");
  assert.ok(panel.includes('class="lang-toggle"'), "More panel has the language toggle");
  assert.ok(panel.includes('class="more-item more-theme"'), "More panel has the theme toggle");
});

test("header: SCAN tab is active (red + underline via .is-active) on the medical page", () => {
  const html = renderLayout({
    lang: "en",
    strings: getStrings("en"),
    title: "T",
    description: "D",
    canonicalPath: "/medical",
    publicOrigin: "https://medicalscanner.20fit.id",
    bodyHtml: "<main>x</main>",
    clientConfig: { apiBase: "https://my.20fit.id", lang: "en" },
    nonce: "n0nce",
    logoLightUrl: "https://x/light.svg",
    logoDarkUrl: "https://x/dark.svg",
  });
  assert.match(html, /class="nav-tab is-active" href="\/medical" data-tab="scan" aria-current="page">Scan</, "SCAN active on /medical");
  // HISTORY's #history view is resolved client-side, so it is not active at SSR.
  assert.match(html, /class="nav-tab" href="\/medical#history" data-tab="history">History</, "HISTORY inactive at SSR");
});

test("header carries the app-switcher (Products menu moved out of the black bar)", () => {
  const html = render("en");
  assert.match(html, /data-role="nav-apps"/, "app-switcher wrapper in the header");
  assert.match(html, /data-act="apps-toggle"/, "waffle toggle button");
  // Products is icon-only now (spec: grid icon, no "Products" text) — the name
  // lives in aria-label for accessibility.
  assert.match(html, /data-act="apps-toggle"[^>]*aria-label="All 20FIT products"/, "Products button named via aria-label");
  assert.ok(!html.includes('<span class="header-label">Products</span>'), "no visible Products text label");
  assert.match(html, /data-role="apps-panel"[^>]*hidden/, "dropdown panel, hidden until opened");
  // The black universal-nav bar is suppressed (data-no-bar); only the header switcher remains.
  assert.match(html, /src="\/universal-nav\.js" data-no-bar/, "universal-nav loaded without its own bar");
});

test("header login control is localized (ID)", () => {
  const html = render("id");
  assert.match(html, /<a class="nav-signup" data-role="login-cta" href="\/register">Daftar<\/a>/, "ID Sign Up CTA");
  assert.match(html, /data-act="apps-toggle"[^>]*aria-label="Semua produk 20FIT"/, "ID products aria-label");
  assert.ok(html.includes(">Keluar</button>"), "ID logout in the dropdown");
  // ID tab labels (Scan · Riwayat).
  assert.match(html, /data-tab="scan"[^>]*>Scan</, "ID SCAN tab");
  assert.match(html, /data-tab="history"[^>]*>Riwayat</, "ID HISTORY tab");
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
