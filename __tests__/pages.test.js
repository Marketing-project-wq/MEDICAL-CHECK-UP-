import { test } from "node:test";
import assert from "node:assert/strict";
import { renderHomeHubPage } from "../src/views/pages.js";

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

test("homepage: hero + pillars + scan (§0.1) + quiz choices + program + Top 5 + sample/how/faq + doctor", () => {
  const p = renderHome("en", "/");

  // Hero owns the single <h1> of the page; its CTA jumps to the on-page scan
  // section (the homepage IS the MCU experience — no separate landing).
  assert.match(p.bodyHtml, /class="hero"/, "hero present");
  assert.equal((p.bodyHtml.match(/<h1[ >]/g) || []).length, 1, "exactly one <h1> (the hero)");
  assert.match(p.bodyHtml, /class="btn btn-primary" href="#scan"/, "hero primary CTA → #scan on page");
  assert.doesNotMatch(p.bodyHtml, /id="ecosystem"/, "ecosystem removed");

  // Pillar nav (quick-jump, 4 pillars) — heading demoted to <h2> under the hero.
  assert.match(p.bodyHtml, /pillar-card/);
  assert.match(p.bodyHtml, /href="#scan"/);
  assert.match(p.bodyHtml, /href="#quiz"/);
  assert.match(p.bodyHtml, /href="#program"/);
  assert.match(p.bodyHtml, /href="#artikel"/);

  // Scan section = the §0.1 widget: login gate present, uploader hidden by
  // default, exactly one file input.
  assert.match(p.bodyHtml, /id="scan"/);
  assert.match(p.bodyHtml, /id="member-app"/);
  assert.match(p.bodyHtml, /data-role="login-gate">/);
  assert.match(p.bodyHtml, /data-role="uploader" hidden>/);
  assert.equal((p.bodyHtml.match(/data-role="file"/g) || []).length, 1);

  // Quiz choices — BMI + exercise-program router.
  assert.match(p.bodyHtml, /id="quiz-choices"/);
  assert.match(p.bodyHtml, /href="#quiz"/);
  assert.match(p.bodyHtml, /href="#exercise-quiz"/);

  // BMI quiz form.
  assert.match(p.bodyHtml, /id="quiz"/);
  assert.match(p.bodyHtml, /data-role="quiz-form"/);
  assert.match(p.bodyHtml, /data-role="q-height"/);
  assert.match(p.bodyHtml, /data-role="q-weight"/);
  assert.match(p.bodyHtml, /data-role="quiz-result"/);

  // Exercise-program chooser — JS-free radios that reveal REAL 20FIT programs.
  assert.match(p.bodyHtml, /id="exercise-quiz"/);
  assert.match(p.bodyHtml, /id="exq-home"/);
  assert.match(p.bodyHtml, /class="exq-reveal exq-r-home"/);
  assert.match(p.bodyHtml, /href="https:\/\/arena\.example"/, "exercise chooser routes to a real program link");

  // Program & training: real options + configurable link + save handoff.
  assert.match(p.bodyHtml, /id="program"/);
  assert.match(p.bodyHtml, /train-card/);
  assert.match(p.bodyHtml, /program-save/);

  // Top 5 Articles to Read Today + See All link.
  assert.match(p.bodyHtml, /Top 5 Articles to Read Today/);
  assert.match(p.bodyHtml, /href="\/articles\/a"/);
  assert.match(p.bodyHtml, /class="link-more" href="\/articles">See All/);

  // Folded-in landing content: §0.1-safe sample result, how-it-works, FAQ.
  assert.match(p.bodyHtml, /id="example"/, "sample result section");
  assert.match(p.bodyHtml, /id="how"/, "how-it-works section");
  assert.match(p.bodyHtml, /id="faq"/, "faq section");

  // Escalation.
  assert.match(p.bodyHtml, /health-disclaimer/);
  assert.match(p.bodyHtml, /doctor-cta/);
  assert.match(p.bodyHtml, /book-doctor/);
});

test("homepage: featured empty state + ID article paths when no articles", () => {
  const p = renderHomeHubPage({ lang: "id", canonicalPath: "/id", featuredArticles: [], bookingUrl: "#", ...CTX });
  assert.match(p.bodyHtml, /id="artikel"/);
  assert.match(p.bodyHtml, /href="\/id\/articles"/);
});
