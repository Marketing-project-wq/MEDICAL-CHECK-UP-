import { test } from "node:test";
import assert from "node:assert/strict";
import { renderHomeHubPage, renderCheckMcuPage } from "../src/views/pages.js";

const CTX = { publicOrigin: "https://medicalcheckup.20fit.id", loginUrl: "https://my.20fit.id/login" };

function renderHome(lang, canonicalPath) {
  return renderHomeHubPage({
    lang,
    canonicalPath,
    featuredArticles: [{ title: "A", slug: "a", category: "ems", excerpt: "x" }],
    bookingUrl: "https://my.20fit.id/book-doctor",
    trainingLinks: { home: "https://my.20fit.id", ems: "https://my.20fit.id", arena: "https://arena.example", clinic: "https://my.20fit.id", my: "https://my.20fit.id" },
    ...CTX,
  });
}

test("homepage: hub only — hero + quiz choices + program + Top 5 + FAQ; links to /check-mcu; NO inline uploader", () => {
  const p = renderHome("en", "/");

  // Hero owns the single <h1>; its CTAs point at the SEPARATE Check MCU page.
  assert.match(p.bodyHtml, /class="hero"/, "hero present");
  assert.equal((p.bodyHtml.match(/<h1[ >]/g) || []).length, 1, "exactly one <h1> (the hero)");
  assert.match(p.bodyHtml, /class="btn btn-primary" href="\/check-mcu"/, "hero primary CTA → /check-mcu");
  assert.match(p.bodyHtml, /href="\/check-mcu#example"/, "hero 'see example' → the tool page's sample");

  // The Scan MCU tool is NOT embedded on the homepage anymore.
  assert.doesNotMatch(p.bodyHtml, /id="member-app"/, "no uploader widget on the homepage");
  assert.equal((p.bodyHtml.match(/data-role="file"/g) || []).length, 0, "no file input on the homepage");
  assert.doesNotMatch(p.bodyHtml, /id="scan"/, "no inline scan section on the homepage");
  assert.doesNotMatch(p.bodyHtml, /id="example"/, "sample result moved to the tool page");
  assert.doesNotMatch(p.bodyHtml, /id="how"/, "how-it-works moved to the tool page");

  // Pillar nav: the Scan pillar links across to /check-mcu; the rest are anchors.
  assert.match(p.bodyHtml, /class="pillar-card" href="\/check-mcu"/, "Scan pillar → /check-mcu");
  assert.match(p.bodyHtml, /href="#quiz"/);
  assert.match(p.bodyHtml, /href="#program"/);
  assert.match(p.bodyHtml, /href="#artikel"/);

  // Quiz choices + BMI + exercise router + program + Top 5 + See All stay.
  assert.match(p.bodyHtml, /id="quiz-choices"/);
  assert.match(p.bodyHtml, /href="#exercise-quiz"/);
  assert.match(p.bodyHtml, /id="quiz"/);
  assert.match(p.bodyHtml, /data-role="quiz-form"/);
  assert.match(p.bodyHtml, /id="exercise-quiz"/);
  assert.match(p.bodyHtml, /href="https:\/\/arena\.example"/, "exercise/program routes to a real link");
  assert.match(p.bodyHtml, /id="program"/);
  assert.match(p.bodyHtml, /program-save/);
  assert.match(p.bodyHtml, /Top 5 Articles to Read Today/);
  assert.match(p.bodyHtml, /href="\/articles\/a"/);
  assert.match(p.bodyHtml, /class="link-more" href="\/articles">See All/);
  assert.match(p.bodyHtml, /id="faq"/, "FAQ stays on the homepage");

  // Escalation is on the homepage too (doctor path always reachable).
  assert.match(p.bodyHtml, /health-disclaimer/);
  assert.match(p.bodyHtml, /doctor-cta/);
});

test("homepage: featured empty state + ID article paths when no articles", () => {
  const p = renderHomeHubPage({ lang: "id", canonicalPath: "/id", featuredArticles: [], bookingUrl: "#", ...CTX });
  assert.match(p.bodyHtml, /id="artikel"/);
  assert.match(p.bodyHtml, /href="\/id\/articles"/);
});

test("Check MCU page: §0.1 gate (login gate, uploader hidden, one file input) + how + sample + doctor", () => {
  const p = renderCheckMcuPage({ lang: "en", canonicalPath: "/check-mcu", bookingUrl: "https://my.20fit.id/book-doctor", ...CTX });

  // Single <h1> for the tool page (the intro), then the §0.1 scan widget.
  assert.equal((p.bodyHtml.match(/<h1[ >]/g) || []).length, 1, "exactly one <h1> (the intro)");
  assert.match(p.bodyHtml, /id="scan"/);
  assert.match(p.bodyHtml, /id="member-app"/);
  assert.match(p.bodyHtml, /data-role="login-gate">/, "anonymous visitors get the login gate");
  assert.match(p.bodyHtml, /data-role="uploader" hidden>/, "uploader hidden by default");
  assert.equal((p.bodyHtml.match(/data-role="file"/g) || []).length, 1, "exactly one file input");

  // How-it-works + §0.1-safe sample result live with the tool.
  assert.match(p.bodyHtml, /id="how"/);
  assert.match(p.bodyHtml, /id="example"/);

  // Doctor escalation present.
  assert.match(p.bodyHtml, /health-disclaimer/);
  assert.match(p.bodyHtml, /doctor-cta/);
  assert.match(p.bodyHtml, /book-doctor/);

  // The return-to for the login gate is the tool page itself.
  assert.match(p.bodyHtml, /data-return-to="https:\/\/medicalcheckup\.20fit\.id\/check-mcu"/);
});
