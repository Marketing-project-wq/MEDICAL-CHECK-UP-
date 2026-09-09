// Server-side reader + evaluator for the CMS-driven health quizzes
// (public.my20fit_quizzes / _questions / _outcomes / _results), rendered on
// medicalcheckup.20fit.id. See MEDICALCHECKUPSUBDOMAINSPEC quiz brief.
//
// - Quizzes + questions are RLS-public (is_active=true) but read here
//   SERVER-SIDE anyway (service role), same as articles.js — keeps the
//   content path consistent with the rest of this app and SSR-able.
// - Outcomes (match_rules + advice text) are RLS service-role-ONLY, on
//   purpose: the safety-sensitive branching (e.g. BMI's "hide the number,
//   suggest a professional instead" path) is evaluated here, never
//   inspectable or bypassable from the browser.
// - Results are written here too (service role) — RLS has no insert policy
//   for anon/authenticated, matching the spec: "Penulisan lewat endpoint
//   server."
// - A short in-memory TTL cache keeps quiz CONTENT off Supabase on every
//   request; result reads/writes are never cached.
// Dependency-free ESM (Node built-in fetch).

const TTL_MS = 5 * 60 * 1000;

export function createQuizStore({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
  const restBase = `${String(supabaseUrl).replace(/\/$/, "")}/rest/v1`;
  const cache = new Map();

  function getCached(key) {
    const e = cache.get(key);
    return e && Date.now() - e.at < TTL_MS ? e.data : undefined;
  }
  function setCached(key, data) {
    cache.set(key, { at: Date.now(), data });
    return data;
  }

  async function rest(pathAndQuery, options = {}) {
    const res = await fetchImpl(`${restBase}${pathAndQuery}`, {
      ...options,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`quiz REST ${res.status} ${pathAndQuery}`);
    return res.status === 204 ? null : res.json();
  }

  async function listActive() {
    const hit = getCached("list");
    if (hit !== undefined) return hit;
    try {
      const rows = await rest(
        "/my20fit_quizzes?is_active=eq.true&select=id,slug,title_id,title_en,description_id,description_en,category,cover_url,estimated_minutes,sort_order&order=sort_order.asc",
      );
      return setCached("list", Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("quizzes.listActive failed:", e.message);
      return []; // graceful empty — never 500 the hub page
    }
  }

  async function getBySlug(slug) {
    if (typeof slug !== "string" || !slug) return null;
    const key = `quiz:${slug}`;
    const hit = getCached(key);
    if (hit !== undefined) return hit;
    try {
      const rows = await rest(
        `/my20fit_quizzes?is_active=eq.true&slug=eq.${encodeURIComponent(slug)}&select=id,slug,title_id,title_en,description_id,description_en,category,cover_url,estimated_minutes&limit=1`,
      );
      const quiz = Array.isArray(rows) && rows[0] ? rows[0] : null;
      if (!quiz) return setCached(key, null);
      const questions = await rest(
        `/my20fit_quiz_questions?quiz_id=eq.${quiz.id}&select=id,order,type,question_id,question_en,help_id,help_en,options,is_required&order=order.asc`,
      );
      const full = { ...quiz, questions: Array.isArray(questions) ? questions : [] };
      return setCached(key, full);
    } catch (e) {
      console.error("quizzes.getBySlug failed:", e.message);
      return null;
    }
  }

  async function getOutcomesFor(quizId) {
    const key = `outcomes:${quizId}`;
    const hit = getCached(key);
    if (hit !== undefined) return hit;
    const rows = await rest(
      `/my20fit_quiz_outcomes?quiz_id=eq.${quizId}&is_active=eq.true&select=key,match_rules,title_id,title_en,advice_id,advice_en,sort_order&order=sort_order.asc`,
    );
    return setCached(key, Array.isArray(rows) ? rows : []);
  }

  async function insertResult({ quizId, anonId, authUserId, answers, outcome }) {
    const row = {
      quiz_id: quizId,
      anon_id: authUserId ? null : anonId || null,
      auth_user_id: authUserId || null,
      answers,
      outcome,
    };
    const rows = await rest("/my20fit_quiz_results", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify([row]),
    });
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  }

  async function listResultsForUser(authUserId, { limit = 20 } = {}) {
    if (!authUserId) return [];
    try {
      const rows = await rest(
        `/my20fit_quiz_results?auth_user_id=eq.${authUserId}&select=id,quiz_id,outcome,created_at&order=created_at.desc&limit=${limit}`,
      );
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      console.error("quizzes.listResultsForUser failed:", e.message);
      return [];
    }
  }

  return { listActive, getBySlug, getOutcomesFor, insertResult, listResultsForUser };
}

// ── Answer validation ───────────────────────────────────────────────────────

const NUMBER_BOUNDS = {
  // Sanity bounds against typos/abuse, not medical limits. Keyed by the
  // question's position within a quiz — see the computeContext() note below
  // on why position (not a semantic key) is what this schema has to work with.
  "cek-bmi": [
    { min: 80, max: 250 }, // height cm
    { min: 25, max: 400 }, // weight kg
    { min: 1, max: 120 }, // age
  ],
};

/**
 * Validates raw submitted answers against a quiz's question definitions.
 * @returns {string|null} an error code, or null if answers are valid.
 */
export function validateAnswers(quiz, answers) {
  if (!answers || typeof answers !== "object") return "invalid_answers";
  const bounds = NUMBER_BOUNDS[quiz.slug];
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const val = answers[q.id];
    const answered = val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
    if (q.is_required && !answered) return "invalid_answers";
    if (!answered) continue;
    if (q.type === "number") {
      const n = Number(val);
      if (!Number.isFinite(n)) return "invalid_answers";
      const b = bounds && bounds[i];
      if (b && (n < b.min || n > b.max)) return "invalid_answers";
    }
    if (q.type === "single_choice" && Array.isArray(q.options)) {
      const ids = q.options.map((o) => o.id);
      if (!ids.includes(val)) return "invalid_answers";
    }
    if (q.type === "multi_choice" && Array.isArray(q.options)) {
      const ids = q.options.map((o) => o.id);
      if (!Array.isArray(val) || val.some((v) => !ids.includes(v))) return "invalid_answers";
    }
  }
  return null;
}

// ── Outcome evaluation (server-only; never shipped to the browser) ─────────

function getVar(ctx, path) {
  const parts = String(path).split(".");
  let v = ctx;
  for (const p of parts) {
    if (v == null) return undefined;
    v = v[p];
  }
  return v;
}

function evalLeaf(leaf, ctx) {
  const val = getVar(ctx, leaf.var);
  switch (leaf.op) {
    case "eq":
      return val === leaf.value;
    case "lt":
      return typeof val === "number" && val < leaf.value;
    case "gt":
      return typeof val === "number" && val > leaf.value;
    case "any_of": {
      const wanted = Array.isArray(leaf.value) ? leaf.value : [leaf.value];
      return Array.isArray(val) ? val.some((v) => wanted.includes(v)) : wanted.includes(val);
    }
    default:
      return false;
  }
}

function evalRule(rule, ctx) {
  if (!rule || typeof rule !== "object") return true;
  if (Array.isArray(rule.all)) return rule.all.every((r) => (r.op ? evalLeaf(r, ctx) : evalRule(r, ctx)));
  if (Array.isArray(rule.any)) return rule.any.some((r) => (r.op ? evalLeaf(r, ctx) : evalRule(r, ctx)));
  if (rule.op) return evalLeaf(rule, ctx);
  return true; // an empty/malformed rule is the intentional shape of a catch-all default
}

// BMI needs a couple of derived values the CMS rules can't express directly
// (the number itself, and whether the respondent is a minor) — special-cased
// by slug since only this one quiz needs it right now. The height/weight/age
// questions are identified by POSITION (this app's own TAHAP-1 content always
// inserts them as questions 1/2/3) because the schema has no semantic "this
// is the height question" key. If the CMS content is ever reordered, this
// needs a real purpose/key column instead of relying on order.
function computeContext(quiz, answers) {
  if (quiz.slug !== "cek-bmi") return {};
  const byOrder = [...quiz.questions].sort((a, b) => a.order - b.order);
  const heightCm = Number(answers[byOrder[0] && byOrder[0].id]);
  const weightKg = Number(answers[byOrder[1] && byOrder[1].id]);
  const age = Number(answers[byOrder[2] && byOrder[2].id]);
  const computed = {};
  if (heightCm > 0 && weightKg > 0) {
    computed.bmi = Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10;
  }
  if (Number.isFinite(age)) computed.age = age;
  return computed;
}

/**
 * Evaluates a quiz's outcomes against submitted answers, server-side only.
 * @returns {{ matched: object|null, computed: object }} matched = the first
 *   outcome (by sort_order ascending — lower sorts first / wins) whose
 *   match_rules pass. computed carries derived values (e.g. bmi) the UI may
 *   need to display regardless of which outcome matched.
 */
export function evaluateOutcome(quiz, outcomes, answers) {
  const computed = computeContext(quiz, answers);
  const ctx = { answers, computed };
  const sorted = [...outcomes].sort((a, b) => a.sort_order - b.sort_order);
  const matched = sorted.find((o) => evalRule(o.match_rules, ctx)) || null;
  return { matched, computed };
}
