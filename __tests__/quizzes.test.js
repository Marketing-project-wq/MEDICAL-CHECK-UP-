import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateOutcome, validateAnswers } from "../src/server/quizzes.js";

// Fixtures mirror the REAL shape/order of the TAHAP-1 CMS content for
// "cek-bmi" and "program-pelari" (see the session's DB report) — synthetic
// uuids so this test needs no network/DB access, but the question ORDER
// (height/weight/age for BMI) and the outcome priority ordering (injury
// beats everything else) match exactly what's actually stored.

const BMI_Q_HEIGHT = "q-height";
const BMI_Q_WEIGHT = "q-weight";
const BMI_Q_AGE = "q-age";
const BMI_Q_GENDER = "q-gender";

const bmiQuiz = {
  slug: "cek-bmi",
  questions: [
    { id: BMI_Q_HEIGHT, order: 1, type: "number", is_required: true },
    { id: BMI_Q_WEIGHT, order: 2, type: "number", is_required: true },
    { id: BMI_Q_AGE, order: 3, type: "number", is_required: true },
    {
      id: BMI_Q_GENDER,
      order: 4,
      type: "single_choice",
      is_required: false,
      options: [
        { id: "male" },
        { id: "female" },
        { id: "other" },
      ],
    },
  ],
};

const bmiOutcomes = [
  {
    key: "minor_note",
    sort_order: 0,
    match_rules: { all: [{ var: `answers.${BMI_Q_AGE}`, op: "lt", value: 18 }] },
  },
  {
    key: "low_gentle_redirect",
    sort_order: 1,
    match_rules: { all: [{ var: "computed.bmi", op: "lt", value: 16.5 }] },
  },
  {
    key: "high_gentle_redirect",
    sort_order: 1,
    match_rules: { all: [{ var: "computed.bmi", op: "gt", value: 40 }] },
  },
  { key: "standard_neutral", sort_order: 100, match_rules: { all: [] } },
];

test("BMI: a normal, adult set of answers gets the neutral outcome with the computed number", () => {
  const answers = { [BMI_Q_HEIGHT]: 170, [BMI_Q_WEIGHT]: 65, [BMI_Q_AGE]: 30, [BMI_Q_GENDER]: "female" };
  const { matched, computed } = evaluateOutcome(bmiQuiz, bmiOutcomes, answers);
  assert.equal(matched.key, "standard_neutral");
  assert.equal(computed.bmi, 22.5);
});

test("BMI: a very low weight is matched to the gentle-redirect outcome, never the number-bearing one", () => {
  // height 170cm, weight 40kg → bmi ≈ 13.8 (well under 16.5)
  const answers = { [BMI_Q_HEIGHT]: 170, [BMI_Q_WEIGHT]: 40, [BMI_Q_AGE]: 25 };
  const { matched, computed } = evaluateOutcome(bmiQuiz, bmiOutcomes, answers);
  assert.equal(matched.key, "low_gentle_redirect");
  // The number is still computed (a handler may need it for logging), but
  // the CALLER is responsible for stripping it before it reaches the
  // browser for this outcome key — see quizHandlers.js's BMI_HIDDEN_NUMBER_KEYS.
  assert.equal(typeof computed.bmi, "number");
});

test("BMI: a very high weight is matched to the gentle-redirect outcome too (symmetric, not just underweight)", () => {
  // height 170cm, weight 130kg → bmi ≈ 45
  const answers = { [BMI_Q_HEIGHT]: 170, [BMI_Q_WEIGHT]: 130, [BMI_Q_AGE]: 40 };
  const { matched } = evaluateOutcome(bmiQuiz, bmiOutcomes, answers);
  assert.equal(matched.key, "high_gentle_redirect");
});

test("BMI: under-18 gets the minor note REGARDLESS of the computed BMI (age check wins by priority)", () => {
  // A BMI that would otherwise be "standard_neutral" (22.5), but age < 18.
  const answers = { [BMI_Q_HEIGHT]: 170, [BMI_Q_WEIGHT]: 65, [BMI_Q_AGE]: 15 };
  const { matched } = evaluateOutcome(bmiQuiz, bmiOutcomes, answers);
  assert.equal(matched.key, "minor_note");
});

test("BMI: validateAnswers rejects a missing required field and an out-of-range number", () => {
  assert.equal(validateAnswers(bmiQuiz, { [BMI_Q_WEIGHT]: 65, [BMI_Q_AGE]: 30 }), "invalid_answers"); // height missing
  assert.equal(
    validateAnswers(bmiQuiz, { [BMI_Q_HEIGHT]: 900, [BMI_Q_WEIGHT]: 65, [BMI_Q_AGE]: 30 }),
    "invalid_answers",
  ); // height way out of bounds
  assert.equal(validateAnswers(bmiQuiz, { [BMI_Q_HEIGHT]: 170, [BMI_Q_WEIGHT]: 65, [BMI_Q_AGE]: 30 }), null);
});

// ── Runner quiz: injury must override every other signal ───────────────────

const RQ_DISTANCE = "rq-distance";
const RQ_TARGET = "rq-target";
const RQ_TIME = "rq-time";
const RQ_INJURY = "rq-injury";

const runnerQuiz = {
  slug: "program-pelari",
  questions: [
    { id: RQ_DISTANCE, order: 1, type: "single_choice", is_required: true, options: [{ id: "not_regular" }, { id: "3_8" }] },
    { id: RQ_TARGET, order: 2, type: "single_choice", is_required: true, options: [{ id: "none" }, { id: "full" }] },
    { id: RQ_TIME, order: 3, type: "single_choice", is_required: true, options: [{ id: "under_1" }, { id: "over_6" }] },
    {
      id: RQ_INJURY,
      order: 4,
      type: "multi_choice",
      is_required: true,
      options: [{ id: "none" }, { id: "knee" }, { id: "ankle" }, { id: "calf_hamstring" }, { id: "lower_back" }, { id: "other" }],
    },
  ],
};

const runnerOutcomes = [
  {
    key: "injury_pivot",
    sort_order: 0,
    match_rules: { all: [{ var: `answers.${RQ_INJURY}`, op: "any_of", value: ["knee", "ankle", "calf_hamstring", "lower_back", "other"] }] },
  },
  {
    key: "structured_race",
    sort_order: 10,
    match_rules: {
      all: [
        { var: `answers.${RQ_TARGET}`, op: "any_of", value: ["half", "full", "hyrox_run"] },
        { var: `answers.${RQ_TIME}`, op: "any_of", value: ["3_6", "over_6"] },
      ],
    },
  },
  {
    key: "beginner_buildup",
    sort_order: 10,
    match_rules: { any: [{ var: `answers.${RQ_DISTANCE}`, op: "eq", value: "not_regular" }, { var: `answers.${RQ_TIME}`, op: "eq", value: "under_1" }] },
  },
  { key: "add_structure", sort_order: 100, match_rules: { all: [] } },
];

test("Runner: an injury answer wins over an otherwise 'structured race training' profile — never a heavy-training outcome", () => {
  // Every other signal points at "structured_race" (full marathon target,
  // >6h/week) — but an injury was reported, so that must NOT be what's shown.
  const answers = { [RQ_DISTANCE]: "3_8", [RQ_TARGET]: "full", [RQ_TIME]: "over_6", [RQ_INJURY]: ["knee"] };
  const { matched } = evaluateOutcome(runnerQuiz, runnerOutcomes, answers);
  assert.equal(matched.key, "injury_pivot");
});

test("Runner: no injury + a serious race target/time gets the structured-training outcome", () => {
  const answers = { [RQ_DISTANCE]: "3_8", [RQ_TARGET]: "full", [RQ_TIME]: "over_6", [RQ_INJURY]: ["none"] };
  const { matched } = evaluateOutcome(runnerQuiz, runnerOutcomes, answers);
  assert.equal(matched.key, "structured_race");
});

test("Runner: no injury + brand new to running gets the beginner build-up outcome", () => {
  const answers = { [RQ_DISTANCE]: "not_regular", [RQ_TARGET]: "none", [RQ_TIME]: "under_1", [RQ_INJURY]: ["none"] };
  const { matched } = evaluateOutcome(runnerQuiz, runnerOutcomes, answers);
  assert.equal(matched.key, "beginner_buildup");
});

test("validateAnswers rejects an unanswered required multi_choice question", () => {
  const answers = { [RQ_DISTANCE]: "3_8", [RQ_TARGET]: "full", [RQ_TIME]: "over_6" }; // injury question missing
  assert.equal(validateAnswers(runnerQuiz, answers), "invalid_answers");
});

test("validateAnswers rejects an option id that isn't a real choice (tampered payload)", () => {
  const answers = { [RQ_DISTANCE]: "not_a_real_option", [RQ_TARGET]: "full", [RQ_TIME]: "over_6", [RQ_INJURY]: ["none"] };
  assert.equal(validateAnswers(runnerQuiz, answers), "invalid_answers");
});

test("evaluateOutcome always resolves to the catch-all default when nothing else matches", () => {
  const answers = { [RQ_DISTANCE]: "3_8", [RQ_TARGET]: "none", [RQ_TIME]: "3_8", [RQ_INJURY]: ["none"] };
  const { matched } = evaluateOutcome(runnerQuiz, runnerOutcomes, answers);
  assert.ok(matched, "a catch-all outcome always matches");
  assert.equal(matched.key, "add_structure");
});
