// Client-side BMI quiz. Pure math on self-entered numbers — nothing is
// uploaded, no AI, no server call; the data never leaves the browser, so this
// is safe for anonymous visitors and needs no §0.1 gate. Standard WHO
// thresholds live in shared/bmi.js; all copy (including the honest "BMI is a
// rough indicator" context) lives in i18n; every result carries the
// "not a diagnosis" note and a link to the 20FIT doctor.

import { bmiValue, bmiCategory, whtrValue, whtrFlag, round1 } from "/shared/bmi.js";
import { getStrings } from "/shared/i18n.js";
import { escapeHtml } from "/shared/escape.js";

const CAT_KEY = { under: "bmiCatUnder", normal: "bmiCatNormal", over: "bmiCatOver", obese: "bmiCatObese" };
// Only "normal" reads as reassuring; everything else nudges toward the doctor.
const CAT_CLASS = { under: "attn", normal: "ok", over: "attn", obese: "attn" };

export function setupQuiz(root, cfg) {
  const q = (sel) => root.querySelector(sel);
  const form = q('[data-role="quiz-form"]');
  if (!form) return;
  const lang = cfg && cfg.lang === "id" ? "id" : "en";
  const s = getStrings(lang);
  const bookingUrl = (cfg && cfg.doctorBookingUrl) || "#";
  const heightEl = q('[data-role="q-height"]');
  const weightEl = q('[data-role="q-weight"]');
  const waistEl = q('[data-role="q-waist"]');
  const statusEl = q('[data-role="q-status"]');
  const resultEl = q('[data-role="quiz-result"]');

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bmi = bmiValue(heightEl.value, weightEl.value);
    // Guard against nonsense / typos (a BMI outside 5–100 is not a real body).
    if (bmi == null || bmi < 5 || bmi > 100) {
      statusEl.textContent = s.quizErrInputs;
      statusEl.classList.add("error");
      resultEl.hidden = true;
      return;
    }
    statusEl.textContent = "";
    statusEl.classList.remove("error");

    const cat = bmiCategory(bmi); // WHO international; Asia-Pacific shown as a note
    const catCls = CAT_CLASS[cat] || "unk";
    const whtr = whtrValue(waistEl.value, heightEl.value);
    const wFlag = whtrFlag(whtr);

    const whtrBlock =
      whtr != null
        ? `<div class="quiz-metric">
             <span class="quiz-metric-label">${escapeHtml(s.whtrLabel)}</span>
             <strong>${escapeHtml((Math.round(whtr * 100) / 100).toFixed(2))}</strong>
             <span class="pill pill-${wFlag === "ok" ? "ok" : "attn"}">${escapeHtml(wFlag === "ok" ? s.whtrOk : s.whtrHigh)}</span>
           </div>`
        : "";

    resultEl.innerHTML = `
      <div class="mcu-disclaimer" role="note"><strong>${escapeHtml(s.healthDisclaimerTitle)}:</strong> ${escapeHtml(s.healthDisclaimerText)}</div>
      <h3>${escapeHtml(s.quizResultHeading)}</h3>
      <div class="quiz-bmi">
        <span class="quiz-bmi-value">${escapeHtml(round1(bmi))}</span>
        <div class="quiz-bmi-meta">
          <span class="quiz-bmi-label">${escapeHtml(s.bmiLabel)}</span>
          <span class="pill pill-${catCls}">${escapeHtml(s[CAT_KEY[cat]] || "")}</span>
        </div>
      </div>
      <p class="quiz-context">${escapeHtml(s.bmiContext)}</p>
      <p class="quiz-context quiz-asia">${escapeHtml(s.bmiAsiaNote)}</p>
      ${whtrBlock}
      <p class="quiz-doctor-line">${escapeHtml(s.quizDoctorLine)} <a href="${escapeHtml(bookingUrl)}">${escapeHtml(s.doctorCtaButton)} →</a></p>
    `;
    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}
