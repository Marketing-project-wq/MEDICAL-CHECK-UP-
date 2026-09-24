// Landing page — the guest-facing homepage of medicalscanner.20fit.id (a standalone
// MCU scanner). Signed-in members never see this: app.js redirects them to /medical.
// It is medicalscanner-specific (my.20fit.id has no such page), so it does NOT affect
// the faithful /medical clone — there is no parity to keep here.
//
// Seven sections per the product brief: hero, how-it-works, what-you-get, a live
// result PREVIEW (rendered by the SAME renderMedical the member view uses, so guests
// see the real thing), honest trust signals (no fabricated counts), FAQ, and a final
// CTA + 20FIT Sports Clinic card. Bilingual copy is inline (ID/EN) and picked by lang.

import { escapeHtml } from "../shared/escape.js";
import { buildResultHTML } from "../shared/renderMedical.js";
import { getSampleMedical } from "../shared/sampleMedical.js";

// Minimal stroke icons (no emoji — RULES.md). 24x24, currentColor stroke.
const IC = {
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 21h14"/>',
  scan: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  brand: '<path d="M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7z"/><path d="M9 12l2 2 4-4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/>',
  shield: '<path d="M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7z"/>',
  clinic: '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6"/><path d="M12 7v4M10 9h4"/>',
  wa: '<path d="M20 12a8 8 0 0 1-11.8 7L4 20l1-4.2A8 8 0 1 1 20 12z"/><path d="M9 9c0 4 2 6 6 6"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>',
};
const svg = (inner, cls = "lp-ic") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

/**
 * @param {object} opts
 * @param {"en"|"id"} opts.lang
 * @param {string} opts.loginUrl
 * @param {string} opts.registerUrl
 * @param {string} opts.bookingUrl        real 20FIT book-doctor URL
 * @param {string} opts.clinicContactUrl  WhatsApp/contact URL (configured, not fabricated)
 * @param {string} opts.clinicAddress     configured clinic name + address
 * @param {string} opts.myOrigin          my.20fit.id origin (for the real Privacy page)
 * @returns {{ title:string, description:string, bodyHtml:string }}
 */
export function renderLandingPage({ lang, loginUrl = "/login", registerUrl = "/register", bookingUrl, clinicContactUrl, clinicAddress, myOrigin }) {
  const L = (o) => (lang === "id" ? (o.id != null ? o.id : o.en) : o.en);
  const e = escapeHtml;
  const idHref = (p) => (lang === "id" ? "/id" + p : p);

  // ── 1. Hero ────────────────────────────────────────────────────────────────
  const hero = `<section class="lp-hero">
    <div class="lp-wrap lp-hero-grid">
      <div class="lp-hero-copy">
        <div class="lp-kick">${e(L({ id: "20FIT MCU Scanner", en: "20FIT MCU Scanner" }))}</div>
        <h1 class="lp-h1">${e(L({ id: "Pahami Hasil Medical Check-Up Anda dalam Hitungan Detik", en: "Understand Your Medical Check-Up Results in Seconds" }))}</h1>
        <p class="lp-lead">${e(L({ id: "Upload foto hasil MCU, sistem baca semua nilainya, lalu jelaskan dalam bahasa yang mudah dimengerti.", en: "Upload a photo of your MCU, the system reads every value, then explains it in plain language." }))}</p>
        <div class="lp-cta-row">
          <a class="lp-btn lp-btn-primary" href="${e(idHref("/login"))}">${e(L({ id: "Masuk", en: "Log in" }))}</a>
          <a class="lp-btn lp-btn-ghost" href="${e(idHref("/register"))}">${e(L({ id: "Daftar Gratis", en: "Sign up free" }))}</a>
        </div>
        <p class="lp-note">${svg(IC.shield, "lp-ic-sm")} ${e(L({ id: "Bukan diagnosis medis — hanya membantu Anda membaca hasil MCU Anda.", en: "Not a medical diagnosis — it only helps you read your MCU results." }))}</p>
      </div>
      <div class="lp-hero-visual" aria-hidden="true">
        <div class="lp-phone">
          <div class="lp-phone-notch"></div>
          <div class="lp-phone-screen">
            <div class="lp-mini-row"><span class="lp-mini-dot ok"></span><span class="lp-mini-bar" style="width:70%"></span></div>
            <div class="lp-mini-row"><span class="lp-mini-dot hi"></span><span class="lp-mini-bar" style="width:92%"></span></div>
            <div class="lp-mini-row"><span class="lp-mini-dot ok"></span><span class="lp-mini-bar" style="width:55%"></span></div>
            <div class="lp-mini-row"><span class="lp-mini-dot lo"></span><span class="lp-mini-bar" style="width:38%"></span></div>
            <div class="lp-mini-row"><span class="lp-mini-dot ok"></span><span class="lp-mini-bar" style="width:64%"></span></div>
          </div>
        </div>
      </div>
    </div>
  </section>`;

  // ── 2. How it works ─────────────────────────────────────────────────────────
  const steps = [
    { ic: IC.upload, t: { id: "Upload Foto MCU", en: "Upload MCU Photo" }, d: { id: "Foto atau PDF hasil lab / medical check-up Anda.", en: "A photo or PDF of your lab / medical check-up." } },
    { ic: IC.scan, t: { id: "Sistem Baca Semua Nilai", en: "It Reads Every Value" }, d: { id: "Setiap parameter dibaca dan dibandingkan dengan rentang normal yang tercetak.", en: "Every parameter is read and compared to the printed normal range." } },
    { ic: IC.eye, t: { id: "Pahami Hasil Anda", en: "Understand Your Results" }, d: { id: "Penjelasan awam per nilai, ditandai normal / tinggi / rendah.", en: "Plain-language notes per value, marked normal / high / low." } },
  ];
  const how = `<section class="lp-section">
    <div class="lp-wrap">
      <h2 class="lp-h2">${e(L({ id: "Cara Kerja", en: "How It Works" }))}</h2>
      <div class="lp-steps">
        ${steps.map((s, i) => `<div class="lp-step"><div class="lp-step-ic">${svg(s.ic)}</div><div class="lp-step-n">0${i + 1}</div><h3>${e(L(s.t))}</h3><p>${e(L(s.d))}</p></div>`).join("")}
      </div>
      <p class="lp-duration">${e(L({ id: "Durasi: ±30 detik dari upload sampai hasil lengkap.", en: "Takes about 30 seconds from upload to a full result." }))}</p>
    </div>
  </section>`;

  // ── 3. What you get ─────────────────────────────────────────────────────────
  const benefits = [
    { id: "Setiap nilai ditandai: Normal / Tinggi / Rendah", en: "Every value marked: Normal / High / Low" },
    { id: "Penjelasan awam untuk setiap parameter lab", en: "Plain-language notes for each lab parameter" },
    { id: "Rentang normal langsung dari dokumen MCU Anda", en: "Normal ranges straight from your MCU document" },
    { id: "Ringkasan keseluruhan + BMI dari profil Anda", en: "An overall summary + BMI from your profile" },
    { id: "Riwayat scan tersimpan — bandingkan dari waktu ke waktu", en: "Scan history saved — compare over time" },
    { id: "Data rahasia — hanya Anda yang bisa akses", en: "Private data — only you can access it" },
  ];
  const get = `<section class="lp-section lp-section-alt">
    <div class="lp-wrap lp-wrap-narrow">
      <h2 class="lp-h2">${e(L({ id: "Apa yang Anda Dapat", en: "What You Get" }))}</h2>
      <ul class="lp-benefits">
        ${benefits.map((b) => `<li>${svg(IC.check, "lp-ic-sm lp-ok")} <span>${e(L(b))}</span></li>`).join("")}
      </ul>
    </div>
  </section>`;

  // ── 4. Result preview (the SAME renderer the member view uses) ───────────────
  const sampleHtml = buildResultHTML(getSampleMedical(lang), { lang, profile: { weight_kg: 72, height_cm: 170, gender: "male", age: 34 }, caloriesUrl: (myOrigin || "https://my.20fit.id") + "/calories.html#mealideas" });
  const preview = `<section class="lp-section">
    <div class="lp-wrap lp-wrap-narrow">
      <h2 class="lp-h2">${e(L({ id: "Contoh Hasil", en: "Result Preview" }))}</h2>
      <p class="lp-sub">${e(L({ id: "Beginilah tampilan hasil scan Anda nanti (ini contoh, bukan data asli).", en: "This is what your scan will look like (an example, not real data)." }))}</p>
      <div class="lp-preview">
        <div class="medrec lp-preview-frame" data-lang="${lang}">
          <div class="wrap"><div id="result">${sampleHtml}</div></div>
        </div>
        <div class="lp-preview-fade">
          <a class="lp-btn lp-btn-primary" href="${e(idHref("/register"))}">${e(L({ id: "Daftar untuk scan hasil MCU Anda", en: "Sign up to scan your own MCU" }))}</a>
        </div>
      </div>
    </div>
  </section>`;

  // ── 5. Trust signals (honest — no fabricated numbers) ───────────────────────
  const badges = [
    { ic: IC.lock, t: { id: "Data Rahasia & Aman", en: "Private & Secure" }, s: { id: "Dilindungi RLS per-akun", en: "Per-account RLS protected" } },
    { ic: IC.brand, t: { id: "Powered by 20FIT", en: "Powered by 20FIT" }, s: { id: "Bagian dari ekosistem 20FIT", en: "Part of the 20FIT ecosystem" } },
    { ic: IC.globe, t: { id: "Dukungan ID & EN", en: "ID & EN Support" }, s: { id: "Baca hasil dua bahasa", en: "Read results in two languages" } },
    { ic: IC.shield, t: { id: "Bukan Diagnosis", en: "Not a Diagnosis" }, s: { id: "Membaca & menjelaskan, bukan mendiagnosa", en: "Reads & explains, never diagnoses" } },
  ];
  const trust = `<section class="lp-section lp-section-alt">
    <div class="lp-wrap">
      <div class="lp-badges">
        ${badges.map((b) => `<div class="lp-badge"><div class="lp-badge-ic">${svg(b.ic)}</div><div class="lp-badge-t">${e(L(b.t))}</div><div class="lp-badge-s">${e(L(b.s))}</div></div>`).join("")}
      </div>
    </div>
  </section>`;

  // ── 6. FAQ (CSP-safe native <details>) ──────────────────────────────────────
  const faqs = [
    { q: { id: "Apakah ini menggantikan konsultasi dokter?", en: "Does this replace seeing a doctor?" }, a: { id: "Tidak. Sistem ini hanya membantu Anda membaca dan memahami nilai yang tertera. Untuk interpretasi klinis, konsultasikan dengan dokter.", en: "No. It only helps you read and understand the values shown. For a clinical interpretation, consult a doctor." } },
    { q: { id: "Apakah data saya aman?", en: "Is my data safe?" }, a: { id: "Ya. Data dilindungi RLS dan hanya Anda yang bisa mengaksesnya.", en: "Yes. Data is protected by RLS and only you can access it." } },
    { q: { id: "Hasil MCU bahasa apa yang bisa di-scan?", en: "Which languages can be scanned?" }, a: { id: "Indonesia dan English — sistem bisa membaca keduanya.", en: "Indonesian and English — the system reads both." } },
    { q: { id: "Apakah foto saya disimpan?", en: "Is my photo stored?" }, a: { id: "Tidak. Foto diproses lalu dibuang; yang disimpan hanya data angka hasil ekstraksi.", en: "No. The photo is processed then discarded; only the extracted numeric data is saved." } },
    { q: { id: "Berapa lama prosesnya?", en: "How long does it take?" }, a: { id: "Sekitar 30 detik dari upload sampai hasil lengkap.", en: "About 30 seconds from upload to a full result." } },
  ];
  const faq = `<section class="lp-section">
    <div class="lp-wrap lp-wrap-narrow">
      <h2 class="lp-h2">${e(L({ id: "Pertanyaan Umum", en: "FAQ" }))}</h2>
      <div class="lp-faq">
        ${faqs.map((f) => `<details class="lp-faq-item"><summary>${e(L(f.q))}</summary><p>${e(L(f.a))}</p></details>`).join("")}
      </div>
    </div>
  </section>`;

  // ── 7. Final CTA + Sports Clinic ────────────────────────────────────────────
  const cta = `<section class="lp-section lp-section-alt">
    <div class="lp-wrap lp-wrap-narrow">
      <div class="lp-final">
        <h2 class="lp-h2">${e(L({ id: "Siap memahami hasil MCU Anda?", en: "Ready to understand your MCU?" }))}</h2>
        <div class="lp-cta-row lp-cta-center">
          <a class="lp-btn lp-btn-primary" href="${e(idHref("/login"))}">${e(L({ id: "Masuk", en: "Log in" }))}</a>
          <a class="lp-btn lp-btn-ghost" href="${e(idHref("/register"))}">${e(L({ id: "Daftar Gratis", en: "Sign up free" }))}</a>
        </div>
      </div>
      <div class="lp-clinic">
        <div class="lp-clinic-ic">${svg(IC.clinic)}</div>
        <div class="lp-clinic-body">
          <div class="lp-clinic-t">${e(L({ id: "Butuh konsultasi lanjutan?", en: "Need a follow-up consultation?" }))}</div>
          <div class="lp-clinic-addr">${e(clinicAddress || "20FIT Sports Clinic")}</div>
          <p class="lp-clinic-s">${e(L({ id: "Dokter kami bisa bantu interpretasi hasil MCU Anda dan menyusun rencana kesehatan yang tepat.", en: "Our doctors can help interpret your MCU results and build a plan that fits you." }))}</p>
          <div class="lp-cta-row">
            <a class="lp-btn lp-btn-clinic" href="${e(clinicContactUrl || bookingUrl || "#")}">${svg(IC.wa, "lp-ic-sm")} ${e(L({ id: "Hubungi via WhatsApp", en: "Contact via WhatsApp" }))}</a>
            <a class="lp-btn lp-btn-ghost" href="${e(bookingUrl || "#")}">${svg(IC.cal, "lp-ic-sm")} ${e(L({ id: "Book Appointment", en: "Book Appointment" }))}</a>
          </div>
        </div>
      </div>
    </div>
  </section>`;

  // ── Footer ──────────────────────────────────────────────────────────────────
  const year = new Date().getFullYear();
  const footer = `<footer class="lp-footer">
    <div class="lp-wrap lp-footer-row">
      <div>© ${year} PT Kredo AUM · 20FIT Sports Clinic</div>
      <div class="lp-footer-links">
        <a href="${e((myOrigin || "https://my.20fit.id") + "/privacy.html")}">${e(L({ id: "Kebijakan Privasi", en: "Privacy Policy" }))}</a>
      </div>
    </div>
  </footer>`;

  const bodyHtml = `<div class="lp">${hero}${how}${get}${preview}${trust}${faq}${cta}${footer}</div>`;

  return {
    title: L({ id: "20FIT MCU Scanner — Pahami Hasil Medical Check-Up Anda", en: "20FIT MCU Scanner — Understand Your Medical Check-Up" }),
    description: L({ id: "Upload hasil Medical Check-Up, sistem baca & jelaskan setiap nilai dalam bahasa yang mudah. Bukan diagnosis medis.", en: "Upload your Medical Check-Up, the system reads & explains every value in plain language. Not a medical diagnosis." }),
    bodyHtml,
  };
}
