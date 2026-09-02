// POST /api/scan — the server-side §0.1 gate.
//
// MEDICALCHECKUPSUBDOMAINSPEC.md §0.1: never process anonymous health data;
// the gate is at UPLOAD, not at the result. So this endpoint ONLY ever runs
// for an authenticated 20FIT member (valid Supabase Bearer token). An
// anonymous request is rejected up front with 401 `auth_required` — the AI
// (my.20fit.id/api/analyze-mcu) is never called on a document that isn't
// tied to a real account.
//
// Member flow: verify token → analyze via my.20fit.id → return the full
// result immediately. The browser then saves it under the member's own RLS
// row (my20fit_mcu_result). No result is ever held server-side, no teaser,
// no anonymous "hold-until-signup" — those violated §0.1 and are gone.
//
// AI is still only ever called server-side, and no AI key or Supabase
// service-role key ships to the browser.

import { callAnalyzeMcu } from "./mcuAnalyze.js";

const MAX_BODY_BYTES = 14 * 1024 * 1024; // ~10MB file base64-encoded + JSON overhead
const MAX_DECODED_BYTES = 10 * 1024 * 1024; // matches the real my.20fit.id backend's multer limit (verified against its source)
const MEMBER_WINDOW_MS = 10 * 60 * 1000;
const MEMBER_MAX_REQ = 20;

// Best-effort in-memory sliding-window limiter (single instance; a hard
// backstop still belongs on the my20fit-dashboard side — see README).
const memberHits = new Map();

function isRateLimited(map, key, windowMs, maxReq) {
  const now = Date.now();
  const recent = (map.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= maxReq) {
    map.set(key, recent);
    return true;
  }
  recent.push(now);
  map.set(key, recent);
  return false;
}

function bearerToken(req) {
  const header = req.headers.authorization;
  return header && header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const declaredLength = Number(req.headers["content-length"] || 0);
    if (declaredLength > MAX_BODY_BYTES) {
      reject({ status: 413, code: "file_too_large" });
      return;
    }
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject({ status: 413, code: "file_too_large" });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject({ status: 400, code: "invalid_body" });
      }
    });
    req.on("error", () => reject({ status: 400, code: "invalid_body" }));
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const ACCEPTED_MIME = new Set(["image/jpeg", "image/png", "application/pdf"]);

export function createScanHandlers({ supabaseAdmin, my20fitOrigin }) {
  async function handleScan(req, res) {
    // §0.1 gate — authenticate BEFORE reading/analyzing anything. An
    // anonymous request never reaches the AI: the upload is refused here.
    const token = bearerToken(req);
    const user = token ? await supabaseAdmin.verifyUser(token) : null;
    if (!user) {
      return sendJson(res, 401, { ok: false, code: "auth_required" });
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, err.status || 400, { ok: false, code: err.code || "invalid_request" });
    }

    if (typeof body.file !== "string" || body.file.length === 0) {
      return sendJson(res, 400, { ok: false, code: "no_file" });
    }
    const mime = typeof body.mime === "string" ? body.mime : "";
    if (!ACCEPTED_MIME.has(mime)) {
      return sendJson(res, 400, { ok: false, code: "unsupported_type" });
    }
    // Rough pre-check on encoded size (exact decoded size is checked by the
    // upstream endpoint too, but failing fast here avoids burning a call).
    const approxDecodedBytes = Math.floor((body.file.length * 3) / 4);
    if (approxDecodedBytes > MAX_DECODED_BYTES) {
      return sendJson(res, 413, { ok: false, code: "file_too_large" });
    }

    if (isRateLimited(memberHits, user.id, MEMBER_WINDOW_MS, MEMBER_MAX_REQ)) {
      return sendJson(res, 429, { ok: false, code: "rate_limited_member" });
    }

    const outcome = await callAnalyzeMcu({ my20fitOrigin, dataUrl: body.file, mime });
    await supabaseAdmin.logAiAccess({
      authUserId: user.id,
      route: "/api/scan",
      ok: outcome.ok,
      errCode: outcome.ok ? null : String(outcome.status),
    });
    if (!outcome.ok) return sendJson(res, outcome.status, { ok: false, code: outcome.code });
    return sendJson(res, 200, { ok: true, mode: "member", result: outcome.result });
  }

  return { handleScan };
}
