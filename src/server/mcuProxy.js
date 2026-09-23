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

    const { status, body: out } = await forward({
      my20fitOrigin,
      path: "/api/mcu",
      token,
      payload: { file: body.file, mime: body.mime, lang: body.lang },
      timeoutMs: MCU_TIMEOUT_MS,
    });
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
