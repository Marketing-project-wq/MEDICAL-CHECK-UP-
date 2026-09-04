import { test } from "node:test";
import assert from "node:assert/strict";
import { renderLandingPage, renderHomeHubPage } from "../src/views/pages.js";

const CTX = { publicOrigin: "https://medicalcheckup.20fit.id", loginUrl: "https://my.20fit.id/login" };

test("landing: hero/sample/how/ecosystem/faq + CTA to hub, and NO uploader", () => {
  for (const [lang, hub] of [["en", "/home"], ["id", "/id/home"]]) {
    const p = renderLandingPage({ lang, canonicalPath: lang === "id" ? "/id" : "/", ...CTX });
    assert.match(p.bodyHtml, /class="hero"/, `${lang}: hero`);
    assert.match(p.bodyHtml, /id="example"/, `${lang}: sample`);
    assert.match(p.bodyHtml, /id="how"/, `${lang}: how-it-works`);
    assert.doesNotMatch(p.bodyHtml, /id="ecosystem"/, `${lang}: ecosystem removed`);
    assert.match(p.bodyHtml, /id="faq"/);
    // The uploader lives on the hub, NOT the landing.
    assert.doesNotMatch(p.bodyHtml, /id="member-app"/, `${lang}: no uploader on landing`);
    assert.doesNotMatch(p.bodyHtml, /data-role="login-gate"/, `${lang}: no login gate on landing`);
    // Hero + landing banner CTAs point at the hub.
    assert.ok(p.bodyHtml.includes(`href="${hub}"`), `${lang}: CTA → ${hub}`);
  }
});

test("hub: pillars + scan widget (§0.1 gate) + quiz coming-soon + featured + doctor CTA", () => {
  const featured = [{ title: "A", slug: "a", category: "ems", excerpt: "x" }];
  const p = renderHomeHubPage({
    lang: "en",
    canonicalPath: "/home",
    featuredArticles: featured,
    bookingUrl: "https://my.20fit.id/book-doctor",
    trainingLinks: { home: "https://my.20fit.id", ems: "https://my.20fit.id", arena: "https://arena.example", clinic: "https://my.20fit.id", my: "https://my.20fit.id" },
    ...CTX,
  });
  // Pillar nav (4 pillars)
  assert.match(p.bodyHtml, /pillar-card/);
  assert.match(p.bodyHtml, /href="#scan"/);
  assert.match(p.bodyHtml, /href="#quiz"/);
  assert.match(p.bodyHtml, /href="#program"/);
  assert.match(p.bodyHtml, /href="#artikel"/);
  // Scan section = the §0.1 widget: login gate present, uploader hidden by default, one file input.
  assert.match(p.bodyHtml, /id="scan"/);
  assert.match(p.bodyHtml, /id="member-app"/);
  assert.match(p.bodyHtml, /data-role="login-gate">/);
  assert.match(p.bodyHtml, /data-role="uploader" hidden>/);
  assert.equal((p.bodyHtml.match(/data-role="file"/g) || []).length, 1);
  // Quiz choices — BMI + exercise-program router
  assert.match(p.bodyHtml, /id="quiz-choices"/);
  assert.match(p.bodyHtml, /href="#quiz"/);
  assert.match(p.bodyHtml, /href="#exercise-quiz"/);
  // Quiz — BMI form (Tahap 2)
  assert.match(p.bodyHtml, /id="quiz"/);
  assert.match(p.bodyHtml, /data-role="quiz-form"/);
  assert.match(p.bodyHtml, /data-role="q-height"/);
  assert.match(p.bodyHtml, /data-role="q-weight"/);
  assert.match(p.bodyHtml, /data-role="quiz-result"/);
  // Exercise-program chooser — JS-free radios that reveal REAL 20FIT programs
  assert.match(p.bodyHtml, /id="exercise-quiz"/);
  assert.match(p.bodyHtml, /id="exq-home"/);
  assert.match(p.bodyHtml, /class="exq-reveal exq-r-home"/);
  // reveals the configured (real) program links, e.g. the arena option
  assert.match(p.bodyHtml, /href="https:\/\/arena\.example"/, "exercise chooser routes to a real program link");
  // Program & training (Tahap 3+4): real options + configurable link + save handoff
  assert.match(p.bodyHtml, /id="program"/);
  assert.match(p.bodyHtml, /train-card/);
  assert.match(p.bodyHtml, /href="https:\/\/arena\.example"/, "uses the configured arena link");
  assert.match(p.bodyHtml, /program-save/);
  // Top 5 Articles to Read Today + See All link
  assert.match(p.bodyHtml, /Top 5 Articles to Read Today/);
  assert.match(p.bodyHtml, /href="\/articles\/a"/);
  assert.match(p.bodyHtml, /class="link-more" href="\/articles">See All/);
  // Escalation
  assert.match(p.bodyHtml, /health-disclaimer/);
  assert.match(p.bodyHtml, /doctor-cta/);
  assert.match(p.bodyHtml, /book-doctor/);
});

test("hub: featured empty state + ID article paths when no articles", () => {
  const p = renderHomeHubPage({ lang: "id", canonicalPath: "/id/home", featuredArticles: [], bookingUrl: "#", ...CTX });
  assert.match(p.bodyHtml, /id="artikel"/);
  assert.match(p.bodyHtml, /href="\/id\/articles"/);
});
