// Faithful port of my.20fit.id/medical's buildResultHTML (profile20fit/medical.html).
// This is the ONE renderer for a saved MCU analysis, so a scan shown on
// medicalscanner.20fit.id looks byte-for-byte like the same scan on
// my.20fit.id/medical — same cards, same class hooks (.card/.ch/.param/.find/
// .ohstat/.prow …), same copy. It consumes the REAL result shape the my20fit-ai
// edge function produces and that both apps store in public.my20fit_mcu_result:
//
//   { document_type, patient_name, date, summary, disclaimer,
//     parameters:      [{ label, value, status, direction, normal_range, explanation }],
//     abnormal_findings:[{ label, value, severity, why_it_matters, what_to_do }],
//     eating_plan: string[], exercise_plan: string[], unreadable: string[],
//     _lang, _alt, i18n }
//
// Pure + zero-dependency: no DOM, no globals, no I18N — everything it needs is
// passed in (lang, profile, urls). That keeps it identical across both surfaces
// and unit-testable in plain node. Numbers/values/parameter names are rendered
// verbatim from the data; only the narrative fields are ever swapped by the
// translation layer upstream (see mergeTrans in the client), never here.

// Escape AI/OCR-sourced text before it goes into innerHTML (defense-in-depth) —
// identical to medical.html's esc().
export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// Pick the language variant of a {en,id} pair — medical.html's L().
function pick(lang, o) {
  return (o && (o[lang] != null ? o[lang] : o.en)) || "";
}

// BMI category — ported verbatim from my.20fit auth.js bmiInfo() so the BMI tile
// (value, color, label, description) is identical. Standard BMI thresholds only.
export function bmiInfo(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  let label, color, desc;
  if (bmi < 18.5) { label = { en: "Underweight", id: "Kurus" }; color = "#e11d2a"; desc = { en: "Below ideal weight.", id: "Berat di bawah ideal." }; }
  else if (bmi < 25) { label = { en: "Normal", id: "Normal" }; color = "#2A7A4F"; desc = { en: "Ideal weight — keep it up!", id: "Berat ideal, pertahankan!" }; }
  else if (bmi < 30) { label = { en: "Overweight", id: "Berlebih" }; color = "#C87000"; desc = { en: "Slightly above ideal.", id: "Sedikit di atas ideal." }; }
  else { label = { en: "Obese", id: "Obesitas" }; color = "#e11d2a"; desc = { en: "Well above ideal.", id: "Jauh di atas ideal." }; }
  return { bmi: bmi.toFixed(1), label, color, desc };
}

// Status dot color — medical.html statusColor(): attention→red, unknown→grey, else green.
function statusColor(s) {
  return s === "attention" ? "#ff6b6b" : s === "unknown" ? "#8a8a8a" : "#46d369";
}

// Severity map for abnormal findings — medical.html SEV.
const SEV = {
  tinggi: { c: "#ff3b30", t: { en: "Needs Attention", id: "Perlu Perhatian" } },
  sedang: { c: "#ff9500", t: { en: "Moderate", id: "Sedang" } },
  ringan: { c: "#ffcc00", t: { en: "Mild", id: "Ringan" } },
};

// Real 20FIT booking lines — identical constants to medical.html (not fabricated).
const BOOK_BOOK = "https://booking.20fit.id/book";
const BOOK_GYM = "https://booking.20fit.id/gym";
const BOOK_CLINIC = "https://booking.20fit.id/clinic";

// Bilingual label table — the med_* strings medical.html reads via I18N.t, kept
// here so the renderer stays self-contained and node-testable.
function labels(lang) {
  const T = {
    med_attention: { en: "Needs Attention", id: "Yang Perlu Diperhatikan" },
    med_params: { en: "Parameter Details", id: "Detail Parameter" },
    med_why: { en: "Why it matters:", id: "Kenapa perlu diperhatikan:" },
    med_do: { en: "What you can do:", id: "Yang bisa dilakukan:" },
    med_eating: { en: "Eating Plan", id: "Rencana Makan" },
    med_exercise: { en: "Exercise Recommendations", id: "Rekomendasi Olahraga" },
    med_unread: { en: "Unreadable parts:", id: "Bagian yang tidak terbaca:" },
  };
  const out = {};
  for (const k in T) out[k] = pick(lang, T[k]);
  return out;
}

function planCard(title, iconInner, iconColor, items, L) {
  if (!items || !items.length) return "";
  return '<div class="card"><div class="ch" style="color:' + iconColor + '"><svg viewBox="0 0 24 24" stroke="' + iconColor + '">' + iconInner + "</svg>" + title + "</div>" +
    items.map((it) => '<div class="plan"><div class="pi" style="background:' + iconColor + '22;color:' + iconColor + '">•</div><div>' + esc(it) + "</div></div>").join("") + "</div>";
}

// Short eating recommendation + "explore more" → the real my.20fit calorie tracker.
function eatingShortCard(res, L, T, caloriesUrl) {
  const items = res.eating_plan || [];
  const fork = '<path d="M3 2v7c0 1.1.9 2 2 2a2 2 0 0 0 2-2V2"/><path d="M5 2v20"/><path d="M21 15V2a5 5 0 0 0-3 9v11"/>';
  const short = items.length ? esc(items[0]) : L({ en: "Focus on balanced meals — enough protein, vegetables & fiber, and cut back on sugar & fried food.", id: "Fokus makan seimbang — cukup protein, sayur & serat, kurangi gula & gorengan." });
  return '<div class="card"><div class="ch" style="color:#2A7A4F"><svg viewBox="0 0 24 24" stroke="#2A7A4F">' + fork + "</svg>" + T.med_eating + "</div>" +
    '<div style="margin-top:6px;line-height:1.55">' + short + "</div>" +
    '<a href="' + esc(caloriesUrl) + '" style="display:block;text-align:center;text-decoration:none;margin-top:12px;padding:12px;border-radius:12px;border:1px solid var(--line);color:#2A7A4F;font-weight:800">' + L({ en: "Explore more food recommendations ›", id: "Lihat rekomendasi makanan lainnya ›" }) + "</a></div>";
}

// Bookable 20FIT programs matched to the health journey — medical.html programsCard.
function programsCard(hasFindings, L) {
  let list = [
    { n: "HYROX Foundation", d: { en: "Beginner functional strength", id: "Kekuatan fungsional, pemula" }, u: BOOK_BOOK },
    { n: "Hyper Class", d: { en: "High-intensity training", id: "Latihan intensitas tinggi" }, u: BOOK_GYM },
    { n: "EMS", d: { en: "Smart muscle activation", id: "Aktivasi otot pintar" }, u: BOOK_GYM },
    { n: "Vinyasa Yoga", d: { en: "Gentle, breath-led", id: "Lembut, mengikuti napas" }, u: BOOK_GYM },
  ];
  if (hasFindings) {
    list = [
      { n: L({ en: "Doctor Consultation", id: "Konsultasi Dokter" }), d: { en: "Discuss your results with a doctor", id: "Bahas hasil check-up dengan dokter" }, u: BOOK_CLINIC, clinic: true },
      { n: "Physiotherapy", d: { en: "Guided, safe recovery", id: "Pemulihan terpandu & aman" }, u: BOOK_CLINIC, clinic: true },
    ].concat(list);
  }
  const exIcon = '<svg viewBox="0 0 24 24" style="width:19px;height:19px;fill:none;stroke:#2563eb;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
  return '<div class="card"><div class="ch" style="color:#2563eb">' + exIcon + L({ en: "Recommended Programs", id: "Program yang Disarankan" }) + "</div>" +
    list.map((p) => '<div class="prow"><div style="flex:1"><div class="pn">' + esc(p.n) + '</div><div class="pd">' + esc(L(p.d)) + "</div></div>" +
      '<a class="bookchip' + (p.clinic ? " clinic" : "") + '" href="' + p.u + '">' + L({ en: "Book", id: "Booking" }) + "</a></div>").join("") + "</div>";
}

/**
 * Build the full result HTML for one analysis — the faithful port of
 * medical.html buildResultHTML(res).
 * @param {object} res  the stored result object (real §parameters shape)
 * @param {object} opts
 * @param {"en"|"id"} opts.lang         active UI language
 * @param {object|null} opts.profile    my20fit_profile row (weight_kg,height_cm,gender,age) for the BMI tiles; null hides them
 * @param {string} opts.caloriesUrl     real calorie-tracker URL for the "explore more" link
 * @returns {string} HTML
 */
export function buildResultHTML(res, { lang = "id", profile = null, caloriesUrl = "https://my.20fit.id/calories.html#mealideas" } = {}) {
  res = res || {};
  const L = (o) => pick(lang, o);
  const T = labels(lang);

  const att = res.abnormal_findings || [];
  const params = (res.parameters || []).map((p) => {
    const col = statusColor(p.status);
    const arrow = p.direction === "high" ? " ↑" : p.direction === "low" ? " ↓" : "";
    return '<div class="param"><div class="ph"><b>' + esc(p.label || "") + '</b><span class="pv" style="color:' + col + '"><span class="dot" style="background:' + col + '"></span>' + esc(p.value || "") + arrow + "</span></div>" +
      '<div class="muted">' + L({ en: "Normal: ", id: "Normal: " }) + esc(p.normal_range || "-") + "</div>" +
      (p.explanation ? '<div style="font-size:13px;margin-top:4px;color:#555">' + esc(p.explanation) + "</div>" : "") + "</div>";
  }).join("");

  const findings = att.map((fd) => {
    const sv = SEV[(fd.severity || "sedang").toLowerCase()] || SEV.sedang;
    return '<div class="find" style="border-color:' + sv.c + '"><div class="ft"><span>' + esc(fd.label || "") + (fd.value ? " · " + esc(fd.value) : "") + '</span><span class="sevtag" style="background:' + sv.c + "22;color:" + sv.c + '">' + esc(L(sv.t)) + "</span></div>" +
      (fd.why_it_matters ? '<div style="font-size:13px;margin-top:6px;color:#9a2a22"><b>' + T.med_why + "</b> " + esc(fd.why_it_matters) + "</div>" : "") +
      (fd.what_to_do ? '<div style="font-size:13px;margin-top:5px;color:#2A7A4F"><b>' + T.med_do + "</b> " + esc(fd.what_to_do) + "</div>" : "") + "</div>";
  }).join("");

  const unread = (res.unreadable && res.unreadable.length)
    ? '<div class="card rfull" style="border-color:#e7c98a;background:#fbf3df;color:#8a6d1a"><b>' + T.med_unread + '</b><ul style="margin:6px 0 0 18px">' + res.unreadable.map((u) => "<li>" + esc(u) + "</li>").join("") + "</ul></div>"
    : "";

  const ICO = { ex: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>' };
  const heart = '<svg viewBox="0 0 24 24" style="width:19px;height:19px;fill:none;stroke:var(--red);stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 4.5 7 9.5 10 11.5 1.5-1 4-2.8 6-5"/></svg>';
  const warn = '<svg viewBox="0 0 24 24" style="width:19px;height:19px;fill:none;stroke:var(--red);stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg>';

  // ---- Overall summary (plain language + BMI/gender/age) ----
  const bi = profile ? bmiInfo(profile.weight_kg, profile.height_cm) : null;
  let stats = "";
  if (bi) stats += '<div class="ohstat"><div class="l">BMI</div><div class="v" style="color:' + bi.color + '">' + bi.bmi + '</div><div class="muted" style="font-size:11px">' + esc(L(bi.label)) + "</div></div>";
  if (profile && profile.gender) stats += '<div class="ohstat"><div class="l">' + L({ en: "Gender", id: "Gender" }) + '</div><div class="v" style="font-size:15px;margin-top:6px">' + (profile.gender === "female" ? L({ en: "Female", id: "Perempuan" }) : L({ en: "Male", id: "Laki-laki" })) + "</div></div>";
  if (profile && profile.age) stats += '<div class="ohstat"><div class="l">' + L({ en: "Age", id: "Usia" }) + '</div><div class="v">' + esc(profile.age) + "</div></div>";

  const attLine = att.length
    ? L({ en: att.length + " thing(s) to watch: ", id: att.length + " hal perlu diperhatikan: " }) + att.map((f) => esc(f.label)).join(", ")
    : L({ en: "All readable values look within the normal range.", id: "Semua nilai yang terbaca tampak dalam batas normal." });

  const overall = '<div class="card rfull"><div class="ch" style="color:var(--red)">' + heart + L({ en: "Overall Summary", id: "Ringkasan Keseluruhan" }) + "</div>" +
    '<div class="muted">' + [res.document_type, res.patient_name, res.date].filter(Boolean).map(esc).join(" · ") + "</div>" +
    (stats ? '<div class="ohrow">' + stats + "</div>" : "") +
    (res.summary ? '<div style="margin-top:10px;line-height:1.55"><b>' + L({ en: "What it means: ", id: "Artinya: " }) + "</b>" + esc(res.summary) + "</div>" : "") +
    '<div style="margin-top:8px;font-weight:700;color:' + (att.length ? "#b3402f" : "#2A7A4F") + '">' + attLine + "</div>" +
    (bi ? '<div class="muted" style="margin-top:6px">' + L({ en: "Overall, based on your BMI & profile: ", id: "Secara umum dari BMI & profilmu: " }) + esc(L(bi.desc)) + "</div>" : "") + "</div>";

  return overall +
    (findings ? '<div class="card rfull"><div class="ch" style="color:var(--red)">' + warn + T.med_attention + "</div>" + findings + "</div>" : "") +
    (params ? '<div class="card"><div style="font-weight:800;margin-bottom:6px">' + T.med_params + "</div>" + params + "</div>" : "") +
    eatingShortCard(res, L, T, caloriesUrl) +
    programsCard(att.length > 0, L) +
    planCard(T.med_exercise, ICO.ex, "#2563eb", res.exercise_plan, L) +
    unread +
    '<div class="card rfull" style="border-color:rgba(196,17,1,.3);background:rgba(196,17,1,.07);color:#8a1f15;font-size:13px"><svg class="emi" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ' +
    (res.disclaimer ? esc(res.disclaimer) : L({ en: "This interpretation is not a substitute for a doctor. Consult the 20FIT doctor for proper advice.", id: "Interpretasi ini bukan pengganti konsultasi dokter. Konsultasikan ke dokter 20FIT untuk saran yang tepat." })) + "</div>";
}
