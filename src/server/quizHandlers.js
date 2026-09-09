// POST /api/quiz/submit + GET /api/quiz/history — the CMS-driven health
// quizzes (medicalcheckup.20fit.id). Unlike /api/scan, quizzes are answerable
// anonymously by design (per the quiz brief: results are shown in full to
// everyone; only saving/history/deeper customization is gated behind login).
//
// The outcome-matching logic (match_rules, including the BMI "hide the
// number, suggest a professional" safety branch) runs ONLY here, never in the
// browser — see quizzes.js for why. A Bearer token is optional: present →
// the result is saved under the member's own account; absent → saved under
// an anon_id the client generated itself, ready to be claimed once they sign
// in (my20fit_claim_anon on the my.20fit side — see TAHAP-1 report).

import { evaluateOutcome, validateAnswers } from "./quizzes.js";
import { bearerToken, readJsonBody, sendJson, createRateLimiter } from "./httpUtil.js";

const MAX_BODY_BYTES = 32 * 1024; // answers are small JSON; generous cap against abuse
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQ = 30;
const isRateLimited = createRateLimiter();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// BMI outcomes that deliberately withhold the number itself (see the brief's
// eating-disorder-safety requirement) — the client must never render
// `computed.bmi` when the matched outcome is one of these.
const BMI_HIDDEN_NUMBER_KEYS = new Set(["low_gentle_redirect", "high_gentle_redirect", "minor_note"]);

function localizedOutcome(row, lang) {
  return {
    key: row.key,
    title: lang === "id" ? row.title_id : row.title_en,
    advice: lang === "id" ? row.advice_id : row.advice_en,
  };
}

export function createQuizHandlers({ quizStore, supabaseAdmin }) {
  async function handleSubmit(req, res) {
    let body;
    try {
      body = await readJsonBody(req, MAX_BODY_BYTES);
    } catch (err) {
      return sendJson(res, err.status || 400, { ok: false, code: err.code || "invalid_body" });
    }

    const slug = typeof body.slug === "string" ? body.slug : "";
    const lang = body.lang === "id" ? "id" : "en";
    const answers = body.answers && typeof body.answers === "object" ? body.answers : null;
    const anonId = typeof body.anonId === "string" && UUID_RE.test(body.anonId) ? body.anonId : null;

    const quiz = slug ? await quizStore.getBySlug(slug) : null;
    if (!quiz) return sendJson(res, 404, { ok: false, code: "quiz_not_found" });
    if (!answers) return sendJson(res, 400, { ok: false, code: "invalid_answers" });

    const invalidCode = validateAnswers(quiz, answers);
    if (invalidCode) return sendJson(res, 400, { ok: false, code: invalidCode });

    const token = bearerToken(req);
    const user = token ? await supabaseAdmin.verifyUser(token) : null;

    // Members submit under their own identity; anonymous visitors need SOME
    // identity to save under (so a later claim can find these rows) — reject
    // rather than silently dropping the row if neither is present.
    if (!user && !anonId) return sendJson(res, 400, { ok: false, code: "invalid_answers" });

    const rateKey = user ? `u:${user.id}` : `a:${anonId}`;
    if (isRateLimited(rateKey, WINDOW_MS, MAX_REQ)) {
      return sendJson(res, 429, { ok: false, code: "rate_limited_quiz" });
    }

    const outcomes = await quizStore.getOutcomesFor(quiz.id);
    const { matched, computed } = evaluateOutcome(quiz, outcomes, answers);
    if (!matched) {
      // Content bug (no catch-all outcome configured) — never crash the
      // visitor's quiz over it, but don't fabricate advice either.
      console.error(`quiz "${slug}": no outcome matched (missing catch-all default in CMS content)`);
      return sendJson(res, 500, { ok: false, code: "quiz_not_found" });
    }

    const outcomeOut = localizedOutcome(matched, lang);
    const computedOut = { ...computed };
    if (quiz.slug === "cek-bmi" && BMI_HIDDEN_NUMBER_KEYS.has(matched.key)) delete computedOut.bmi;

    const saved = await quizStore.insertResult({
      quizId: quiz.id,
      anonId,
      authUserId: user ? user.id : null,
      answers,
      // Store both language variants so a later language switch on the
      // history page doesn't need to re-evaluate anything.
      outcome: { key: matched.key, title_id: matched.title_id, title_en: matched.title_en, advice_id: matched.advice_id, advice_en: matched.advice_en, computed },
    });

    return sendJson(res, 200, {
      ok: true,
      resultId: saved ? saved.id : null,
      outcome: outcomeOut,
      computed: computedOut,
    });
  }

  async function handleHistory(req, res) {
    const token = bearerToken(req);
    const user = token ? await supabaseAdmin.verifyUser(token) : null;
    if (!user) return sendJson(res, 401, { ok: false, code: "auth_required" });

    const url = new URL(req.url, "http://localhost");
    const lang = url.searchParams.get("lang") === "id" ? "id" : "en";
    const rows = await quizStore.listResultsForUser(user.id);
    const quizzes = await quizStore.listActive();
    const bySlugId = new Map(quizzes.map((q) => [q.id, q]));

    const items = rows.map((r) => {
      const quiz = bySlugId.get(r.quiz_id);
      const o = r.outcome || {};
      return {
        id: r.id,
        quizSlug: quiz ? quiz.slug : null,
        quizTitle: quiz ? (lang === "id" ? quiz.title_id : quiz.title_en) : null,
        outcomeTitle: lang === "id" ? o.title_id : o.title_en,
        createdAt: r.created_at,
      };
    });
    return sendJson(res, 200, { ok: true, items });
  }

  return { handleSubmit, handleHistory };
}
