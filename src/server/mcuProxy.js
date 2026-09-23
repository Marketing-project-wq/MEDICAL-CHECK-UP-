// POST /api/mcu  and  POST /api/translate — the member MCU analysis + translation
// endpoints, identical in contract to my.20fit.id's own /api/mcu and /api/translate
// (see profile20fit/server.js). This app does NOT hold an AI key or the AI edge
// secret: it forwards the member's Supabase Bearer token to my.20fit.id, which
// verifies it (same Supabase project) and calls the SAME my20fit-ai edge function
// with the SAME extraction/explanation prompts. So the result is byte-for-byte
// what my.20fit.id/medical would produce — no prompts re-invented here, and the
// two surfaces stay in perfect sync (same table, same result shape).
//
// The gate stays at the member: no Bearer token → 401 before any upstream call,
// so an anonymous document is never analyzed (spec §0.1). AI is only ever reached
// server-side; the browser only ever talks to THIS origin.

import { bearerToken, readJsonBody, sendJson, createRateLimiter } from "./httpUtil.js";

const MAX_MCU_BODY_BYTES = 14 * 1024 * 1024; // ~10MB image base64 + JSON overhead
const MAX_TRANSLATE_BODY_BYTES = 256 * 1024; // my.20fit caps data at 12k chars; this is generous headroom
const MCU_TIMEOUT_MS = 95_000; // matches medical.html's 95s client abort
const TRANSLATE_TIMEOUT_MS = 45_000; // matches medical.html's 45s client abort

// Best-effort, per-member daily cap (spec: 10 scans/day). In-memory sliding
// window keyed by the caller's token; my.20fit.id's own aiLimiter is the durable
// backstop. Resets on restart, which only ever grants MORE headroom, never less.
const MEMBER_WINDOW_MS = 24 * 60 * 60 * 1000;
const MEMBER_MAX_SCANS = 10;
const isRateLimited = createRateLimiter();

// ── Upload validation: only real Medical Check-Up / lab documents (RULES.md §2) ──
// Before spending the (expensive) extraction call, ask a cheap vision model whether
// the image is actually an MCU/lab result and reject anything else (a selfie, food,
// a receipt, …). This is a NEW guard medicalscanner adds on top of my.20fit's
// pipeline; it lives entirely here so the shared my20fit-ai edge (which powers the
// whole 20FIT ecosystem) is never touched. It is OPTIONAL and FAIL-OPEN: with no
// OPENROUTER_API_KEY set, or on any validation error/timeout, the upload proceeds —
// we never block a genuine result on the guard itself. A keyless safety net (an
// empty extraction) still catches non-MCU documents downstream.
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const VALIDATION_MODEL = process.env.MCU_VALIDATION_MODEL || "google/gemini-2.5-flash";
const VALIDATION_TIMEOUT_MS = 20_000;
const VALIDATION_PROMPT =
  "Look at this image. Is it a MEDICAL CHECK-UP (MCU) / laboratory / blood test / health examination result from a hospital, clinic, or lab? " +
  "ACCEPT: blood lab results (hematology, blood chemistry, lipid profile), full medical check-up results, urine tests, liver/kidney function tests, " +
  "hospital/clinic examination reports, a screenshot of lab results from a hospital app, or a photo/print-out/PDF of a laboratory report. " +
  "REJECT: selfies or photos of people, food, chat/social-media screenshots, scenery/places, non-medical documents (invoice, receipt, ID card), " +
  "workout/exercise photos, or any random image that is not a lab/MCU result. " +
  'Respond ONLY with JSON (no markdown): {"is_mcu": true or false, "confidence": "high"|"medium"|"low", "reason": "short reason"}';

function parseJsonLoose(text) {
  if (typeof text !== "string") return null;
  try { return JSON.parse(text); } catch { /* try to slice a JSON object out of fenced/preamble text */ }
  const a = text.indexOf("{"), z = text.lastIndexOf("}");
  if (a >= 0 && z > a) { try { return JSON.parse(text.slice(a, z + 1)); } catch { /* ignore */ } }
  return null;
}

// Returns { checked:false } when validation is disabled/unavailable (fail-open),
// or { checked:true, isMcu, reason } when the model gave a verdict.
async function validateMcuImage(dataUrl) {
  if (!OPENROUTER_API_KEY) return { checked: false };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT_MS);
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://medicalscanner.20fit.id",
        "X-Title": "20FIT MCU Scanner",
      },
      body: JSON.stringify({
        model: VALIDATION_MODEL,
        max_tokens: 120,
        temperature: 0,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
            { type: "text", text: VALIDATION_PROMPT },
          ],
        }],
      }),
    });
    if (!r.ok) return { checked: false }; // fail-open on API error
    const data = await r.json().catch(() => null);
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    const parsed = parseJsonLoose(content);
    if (!parsed || typeof parsed.is_mcu !== "boolean") return { checked: false }; // fail-open on unparseable
    return { checked: true, isMcu: parsed.is_mcu, reason: typeof parsed.reason === "string" ? parsed.reason : "" };
  } catch {
    return { checked: false }; // fail-open on timeout/network
  } finally {
    clearTimeout(timer);
  }
}

// A genuine MCU always yields at least one parameter or finding. An empty
// extraction (parameters AND abnormal_findings both empty) means the document
// wasn't a readable lab result — a keyless backstop to the vision guard above.
function looksLikeNonMcuResult(result) {
  if (!result || typeof result !== "object") return false;
  const params = Array.isArray(result.parameters) ? result.parameters : [];
  const findings = Array.isArray(result.abnormal_findings) ? result.abnormal_findings : [];
  return params.length === 0 && findings.length === 0;
}

// Forward a JSON POST to my.20fit.id, carrying the member's Bearer token, and
// relay the upstream status + JSON body back verbatim (so the client sees the
// exact same shape/codes it would from my.20fit.id itself).
async function forward({ my20fitOrigin, path, token, payload, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const upstream = await fetch(`${my20fitOrigin}${path}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(payload),
    });
    const body = await upstream.json().catch(() => ({}));
    return { status: upstream.status, body };
  } catch (err) {
    if (err && err.name === "AbortError") {
      return { status: 504, body: { ok: false, error: "timeout" } };
    }
    console.error(`mcuProxy forward ${path} failed:`, err && err.message);
    return { status: 502, body: { ok: false, error: "upstream_unreachable" } };
  } finally {
    clearTimeout(timer);
  }
}

export function createMcuProxyHandlers({ my20fitOrigin }) {
  // POST /api/mcu — analyze an uploaded MCU document. Body: {file, mime, lang}.
  async function handleMcu(req, res) {
    const token = bearerToken(req);
    if (!token) return sendJson(res, 401, { ok: false, error: "auth_required", session_expired: true });

    let body;
    try {
      body = await readJsonBody(req, MAX_MCU_BODY_BYTES, "file_too_large");
    } catch (err) {
      return sendJson(res, err.status || 400, { ok: false, error: err.code || "invalid_request" });
    }
    if (typeof body.file !== "string" || body.file.length === 0) {
      return sendJson(res, 400, { ok: false, error: "no_file" });
    }

    if (isRateLimited(token, MEMBER_WINDOW_MS, MEMBER_MAX_SCANS)) {
      return sendJson(res, 429, { ok: false, error: "rate_limited" });
    }

    // RULES.md §2 — only real MCU/lab documents. Validate images before extraction
    // (fail-open; PDFs skip the vision check and rely on the empty-result net below).
    const isImage = String(body.mime || "").startsWith("image/") || String(body.file).startsWith("data:image/");
    if (isImage) {
      const v = await validateMcuImage(body.file);
      if (v.checked && !v.isMcu) {
        return sendJson(res, 400, { ok: false, error: "invalid_photo", reason: v.reason || "" });
      }
    }

    const { status, body: out } = await forward({
      my20fitOrigin,
      path: "/api/mcu",
      token,
      payload: { file: body.file, mime: body.mime, lang: body.lang },
      timeoutMs: MCU_TIMEOUT_MS,
    });

    // Keyless backstop: a successful extraction that produced no parameters and no
    // findings wasn't a readable MCU — surface it as invalid_photo, not an empty result.
    if (status === 200 && out && out.result && looksLikeNonMcuResult(out.result)) {
      return sendJson(res, 422, { ok: false, error: "invalid_photo", reason: "no_readable_values" });
    }
    return sendJson(res, status, out);
  }

  // POST /api/translate — translate a result's narrative to {lang}. Body: {lang, data}.
  async function handleTranslate(req, res) {
    const token = bearerToken(req);
    if (!token) return sendJson(res, 401, { ok: false, error: "auth_required", session_expired: true });

    let body;
    try {
      body = await readJsonBody(req, MAX_TRANSLATE_BODY_BYTES, "payload_too_large");
    } catch (err) {
      return sendJson(res, err.status || 400, { ok: false, error: err.code || "invalid_request" });
    }
    if (!body.data || !body.lang) {
      return sendJson(res, 400, { ok: false, error: "incomplete" });
    }

    const { status, body: out } = await forward({
      my20fitOrigin,
      path: "/api/translate",
      token,
      payload: { lang: body.lang, data: body.data },
      timeoutMs: TRANSLATE_TIMEOUT_MS,
    });
    return sendJson(res, status, out);
  }

  return { handleMcu, handleTranslate };
}
