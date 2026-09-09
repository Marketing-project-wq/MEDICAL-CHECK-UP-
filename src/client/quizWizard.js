// Generic one-question-per-screen wizard for the CMS-driven health quizzes
// (medicalcheckup.20fit.id /quiz/<slug>). Data-driven: every quiz (BMI,
// Runner, HYROX, Sleep, …) is rendered by this SAME code from the question
// list injected by the server (see views/quizPages.js) — nothing quiz-
// specific is hardcoded here.
//
// - Draft answers are saved to localStorage per quiz slug so closing the tab
//   mid-quiz doesn't lose progress.
// - Anonymous visitors get an anon id (localStorage, generated once) sent
//   with the submission, so a save is possible before login exists —
//   completing the "anon result follows you into your account" promise
//   needs my.20fit's OWN login flow to call the my20fit_claim_anon RPC with
//   this id, which is outside this repo; see the TAHAP-1/2 report.
// - The result is ALWAYS shown in full, anonymous or not (spec: never blur
//   the result) — only the "save & customize further" step is gated.
// - Outcome matching (including the BMI safety branches) happens server-side
//   only — this file just renders whatever /api/quiz/submit returns.

import { getStrings } from "/shared/i18n.js";
import { escapeHtml } from "/shared/escape.js";
import { buildLoginUrl } from "/shared/returnTo.js";

const ANON_ID_KEY = "mcu20fit-anon-id";

function getOrCreateAnonId() {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return null; // storage unavailable — submission still works, just isn't resumable/claimable later
  }
}

function draftKey(slug) {
  return `mcu20fit-quiz-draft-${slug}`;
}
function loadDraft(slug) {
  try {
    const raw = localStorage.getItem(draftKey(slug));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function saveDraft(slug, answers) {
  try {
    localStorage.setItem(draftKey(slug), JSON.stringify(answers));
  } catch {
    /* best effort */
  }
}
function clearDraft(slug) {
  try {
    localStorage.removeItem(draftKey(slug));
  } catch {
    /* best effort */
  }
}

export function setupQuizWizard(root, cfg, supabase) {
  const mount = root.querySelector('[data-role="quiz-wizard"]');
  if (!mount) return;

  const lang = cfg && cfg.lang === "id" ? "id" : "en";
  const s = getStrings(lang);
  let quiz;
  try {
    quiz = JSON.parse(mount.dataset.quiz);
  } catch {
    return; // malformed injected data — fail closed, nothing to render
  }
  const slug = mount.dataset.slug;
  const loginBase = mount.dataset.loginBase;
  const returnTo = mount.dataset.returnTo;

  const questions = [...quiz.questions].sort((a, b) => a.order - b.order);
  const answers = loadDraft(slug);
  let step = 0;

  const progressEl = mount.querySelector('[data-role="qw-progress"]');
  const progressFill = mount.querySelector('[data-role="qw-progress-fill"]');
  const progressLabel = mount.querySelector('[data-role="qw-progress-label"]');
  const form = mount.querySelector('[data-role="qw-form"]');
  const qContainer = mount.querySelector('[data-role="qw-question"]');
  const backBtn = mount.querySelector('[data-act="qw-back"]');
  const nextBtn = mount.querySelector('[data-act="qw-next"]');
  const resultEl = mount.querySelector('[data-role="qw-result"]');

  const anonId = getOrCreateAnonId();

  const qLabel = (q) => (lang === "id" ? q.question_id : q.question_en);
  const qHelp = (q) => (lang === "id" ? q.help_id : q.help_en);
  const optLabel = (o) => (lang === "id" ? o.label_id : o.label_en);

  function renderQuestion() {
    const q = questions[step];
    progressEl.hidden = false;
    progressFill.style.width = `${Math.round(((step + 1) / questions.length) * 100)}%`;
    progressLabel.textContent = s.quizProgressLabel
      .replace("{n}", String(step + 1))
      .replace("{total}", String(questions.length));

    let inner = `<h2 class="quiz-wizard-question" id="qw-heading">${escapeHtml(qLabel(q))}</h2>`;
    const help = qHelp(q);
    if (help) inner += `<p class="quiz-wizard-help">${escapeHtml(help)}</p>`;

    if (q.type === "number") {
      const val = answers[q.id] ?? "";
      inner += `<input type="number" inputmode="decimal" class="quiz-wizard-input" aria-labelledby="qw-heading"
        data-role="qw-input" value="${escapeHtml(String(val))}" ${q.is_required ? "required" : ""}>`;
    } else if (q.type === "single_choice") {
      inner += `<div class="quiz-wizard-options" role="radiogroup" aria-labelledby="qw-heading">${(q.options || [])
        .map(
          (o) => `<label class="quiz-wizard-opt">
            <input type="radio" name="qw-opt" value="${escapeHtml(o.id)}" data-role="qw-input" ${answers[q.id] === o.id ? "checked" : ""}>
            <span>${escapeHtml(optLabel(o))}</span>
          </label>`,
        )
        .join("")}</div>`;
    } else if (q.type === "multi_choice") {
      const selected = Array.isArray(answers[q.id]) ? answers[q.id] : [];
      inner += `<div class="quiz-wizard-options">${(q.options || [])
        .map(
          (o) => `<label class="quiz-wizard-opt">
            <input type="checkbox" value="${escapeHtml(o.id)}" data-role="qw-input" ${selected.includes(o.id) ? "checked" : ""}>
            <span>${escapeHtml(optLabel(o))}</span>
          </label>`,
        )
        .join("")}</div>`;
    }
    qContainer.innerHTML = inner;
    backBtn.hidden = step === 0;
    nextBtn.textContent = step === questions.length - 1 ? s.quizFinish : s.quizNext;
    nextBtn.disabled = false;

    const firstInput = qContainer.querySelector('[data-role="qw-input"]');
    if (firstInput) firstInput.focus();
  }

  function readCurrentAnswer() {
    const q = questions[step];
    if (q.type === "number") {
      const input = qContainer.querySelector('[data-role="qw-input"]');
      return input.value === "" ? undefined : Number(input.value);
    }
    if (q.type === "single_choice") {
      const checked = qContainer.querySelector('[data-role="qw-input"]:checked');
      return checked ? checked.value : undefined;
    }
    if (q.type === "multi_choice") {
      return [...qContainer.querySelectorAll('[data-role="qw-input"]:checked')].map((c) => c.value);
    }
    return undefined;
  }

  function isAnswered(val) {
    return val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = questions[step];
    const val = readCurrentAnswer();
    const answered = isAnswered(val);
    if (q.is_required && !answered) {
      const input = qContainer.querySelector('[data-role="qw-input"]');
      if (input && input.reportValidity) input.reportValidity();
      return;
    }
    if (answered) answers[q.id] = val;
    else delete answers[q.id];
    saveDraft(slug, answers);

    if (step < questions.length - 1) {
      step += 1;
      renderQuestion();
    } else {
      submitQuiz();
    }
  });

  backBtn.addEventListener("click", () => {
    if (step === 0) return;
    step -= 1;
    renderQuestion();
  });

  async function currentAccessToken() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data && data.session ? data.session.access_token : null;
  }

  function showStatus(msg) {
    const existing = qContainer.querySelector(".status-msg");
    if (existing) existing.remove();
    qContainer.insertAdjacentHTML("beforeend", `<p class="status-msg error" role="alert">${escapeHtml(msg)}</p>`);
  }

  async function submitQuiz() {
    nextBtn.disabled = true;
    backBtn.disabled = true;
    let token = null;
    try {
      token = await currentAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers,
        body: JSON.stringify({ slug, answers, anonId, lang }),
      });
      const data = await res.json().catch(() => ({}));
      nextBtn.disabled = false;
      backBtn.disabled = false;
      if (!res.ok || !data.ok) {
        showStatus(s.errGeneric);
        return;
      }
      clearDraft(slug);
      showResult(data.outcome, data.computed || {}, Boolean(token));
    } catch {
      nextBtn.disabled = false;
      backBtn.disabled = false;
      showStatus(s.errNetwork);
    }
  }

  function showResult(outcome, computed, isMember) {
    form.hidden = true;
    progressEl.hidden = true;

    let html = `<div class="quiz-result-card">`;
    if (typeof computed.bmi === "number") {
      html += `<div class="quiz-bmi">
        <span class="quiz-bmi-value">${escapeHtml(String(computed.bmi))}</span>
        <span class="quiz-bmi-label">${escapeHtml(s.bmiLabel)}</span>
      </div>`;
    }
    html += `<h2>${escapeHtml(outcome.title)}</h2><p>${escapeHtml(outcome.advice)}</p></div>`;

    if (!isMember) {
      const loginHref = buildLoginUrl(loginBase, returnTo);
      html += `<p class="program-save">${escapeHtml(s.quizSaveNote)} <a href="${escapeHtml(loginHref)}">${escapeHtml(s.quizSaveCta)} →</a></p>`;
    }
    html += `<p class="quiz-restart"><a href="${escapeHtml(location.pathname)}">${escapeHtml(s.quizRetake)}</a></p>`;

    resultEl.innerHTML = html;
    resultEl.hidden = false;
    resultEl.setAttribute("role", "status");
    resultEl.setAttribute("tabindex", "-1");
    resultEl.focus();
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  renderQuestion();
}
