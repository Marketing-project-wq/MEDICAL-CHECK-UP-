// Proxies to the REAL my.20fit.id analysis endpoint (verified against the
// my20fit-dashboard source: POST /api/analyze-mcu, multipart, no auth check
// today) and derives the safe "teaser" shown to anonymous visitors before
// they have an account. AI is only ever called from here (the server) —
// never from the browser, and no AI key lives in this app either way,
// since my20fit-dashboard holds its own key.

const CATEGORY_RULES = [
  { match: /kolesterol|ldl|hdl|trigliserida|lipid/i, id: "Profil Lipid", en: "Lipid Profile" },
  { match: /gula|glukosa|gds|hba1c|diabetes/i, id: "Gula Darah", en: "Blood Sugar" },
  { match: /tekanan darah|sistol|diastol/i, id: "Tekanan Darah", en: "Blood Pressure" },
  { match: /hemoglobin|leukosit|eritrosit|trombosit|darah lengkap/i, id: "Darah Lengkap", en: "Complete Blood Count" },
  { match: /sgot|sgpt|hati|liver/i, id: "Fungsi Hati", en: "Liver Function" },
  { match: /ureum|kreatinin|ginjal/i, id: "Fungsi Ginjal", en: "Kidney Function" },
  { match: /asam urat|urat/i, id: "Asam Urat", en: "Uric Acid" },
  { match: /bmi|berat|imt/i, id: "Indeks Tubuh", en: "Body Index" },
];

function categoryFor(label, lang) {
  const rule = CATEGORY_RULES.find((r) => r.match.test(label || ""));
  if (rule) return lang === "en" ? rule.en : rule.id;
  return lang === "en" ? "Other Markers" : "Penanda Lain";
}

/**
 * Derives ONLY safe, non-sensitive fields from a real analysis result —
 * counts and category names, never a value/status/explanation pair. This is
 * what an anonymous visitor's browser receives; the full `result` never
 * reaches them until they claim it post-signup.
 */
export function deriveTeaser(result, lang) {
  const metrics = Array.isArray(result?.metrics) ? result.metrics : [];
  const categories = [...new Set(metrics.map((m) => categoryFor(m?.label, lang)))];
  return {
    parameters_detected: metrics.length,
    categories,
    scanned_at: new Date().toISOString(),
  };
}

function dataUrlToBuffer(dataUrl) {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || "";
  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? "";
  const buffer = isBase64 ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload), "utf8");
  return { mime, buffer };
}

/**
 * @returns {Promise<{ok:true, result:object} | {ok:false, status:number, code:string}>}
 */
export async function callAnalyzeMcu({ my20fitOrigin, dataUrl, mime, timeoutMs = 90_000 }) {
  const decoded = dataUrlToBuffer(dataUrl);
  if (!decoded || decoded.buffer.length === 0) {
    return { ok: false, status: 400, code: "no_file" };
  }

  const form = new FormData();
  const ext = mime === "image/png" ? "png" : mime === "application/pdf" ? "pdf" : "jpg";
  form.append("file", new Blob([decoded.buffer], { type: mime || decoded.mime }), `scan.${ext}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${my20fitOrigin}/api/analyze-mcu`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      // The upstream message (body.message/body.error) is dynamic, upstream-
      // controlled text we cannot guarantee is translated — log it for
      // diagnosis but never forward it as the user-facing error; the client
      // always renders a fully-localized string for this fixed code instead.
      console.error(`analyze-mcu upstream error ${res.status}:`, body.message || body.error || "(no message)");
      return { ok: false, status: res.status, code: "analyze_failed" };
    }
    return { ok: true, result: body };
  } catch (err) {
    if (err && err.name === "AbortError") {
      console.error(`callAnalyzeMcu timed out after ${timeoutMs}ms calling ${my20fitOrigin}/api/analyze-mcu`);
      return { ok: false, status: 504, code: "analyze_timeout" };
    }
    console.error("callAnalyzeMcu failed:", err);
    return { ok: false, status: 502, code: "analyze_failed" };
  } finally {
    clearTimeout(timer);
  }
}
