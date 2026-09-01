// POST /api/scan and POST /api/scan/claim — the server-side "hold until
// account exists" gate (Tahap 3+4 of MEDICALCHECKUPSUBDOMAINSPEC.md).
//
// Anonymous visitors: file is analyzed immediately (the real my.20fit.id
// endpoint has no separate cheap-classify-only step to defer to — see the
// README), but the FULL result is held server-side only. The browser gets
// back nothing but a safe count/category teaser and a scan_id. The full
// result is only ever handed over via /api/scan/claim, once a real account
// exists to attach it to.
//
// Members: same endpoint, full result returned immediately (existing
// behavior), no hold, no teaser.

import crypto from "node:crypto";
import { callAnalyzeMcu, deriveTeaser } from "./mcuAnalyze.js";

const MAX_BODY_BYTES = 12 * 1024 * 1024; // ~8MB file base64-encoded + JSON overhead
const MAX_DECODED_BYTES = 8 * 1024 * 1024; // spec §3 limit
const ANON_LIFETIME_SCAN_CAP = 3; // free scans per anon_id before an account is required — adjust as needed
const IP_NEW_SESSION_CAP_PER_DAY = 8; // new anon_ids per ip_hash per rolling 24h — anti reset-by-clearing-localStorage
const MEMBER_WINDOW_MS = 10 * 60 * 1000;
const MEMBER_MAX_REQ = 20;
const ANON_WINDOW_MS = 10 * 60 * 1000;
const ANON_MAX_REQ = 10;

// Best-effort in-memory sliding-window limiters (single instance; a hard
// backstop still belongs on the my20fit-dashboard side — see README).
const memberHits = new Map();
const anonHits = new Map();

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

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function hashValue(value, salt) {
  return crypto.createHash("sha256").update(`${salt}:${value}`).digest("hex");
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

export function createScanHandlers({ supabaseAdmin, my20fitOrigin, ipHashSalt, lang: defaultLang }) {
  async function handleScan(req, res) {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, err.status || 400, { ok: false, code: err.code || "invalid_request" });
    }

    const lang = body.lang === "en" ? "en" : defaultLang || "id";
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

    const ip = clientIp(req);
    const ipHash = hashValue(ip, ipHashSalt);
    const token = bearerToken(req);
    const user = token ? await supabaseAdmin.verifyUser(token) : null;

    if (user) {
      // ── Member path: unchanged behavior, full result returned immediately. ──
      if (isRateLimited(memberHits, user.id, MEMBER_WINDOW_MS, MEMBER_MAX_REQ)) {
        return sendJson(res, 429, { ok: false, code: "rate_limited_member" });
      }
      const outcome = await callAnalyzeMcu({ my20fitOrigin, dataUrl: body.file, mime });
      await supabaseAdmin.logAiAccess({ authUserId: user.id, route: "/api/scan", ok: outcome.ok, errCode: outcome.ok ? null : String(outcome.status) });
      if (!outcome.ok) return sendJson(res, outcome.status, { ok: false, code: outcome.code });
      return sendJson(res, 200, { ok: true, mode: "member", result: outcome.result });
    }

    // ── Anonymous path: hold the result, return only a safe teaser. ──
    const anonId = req.headers["x-anon-id"];
    if (typeof anonId !== "string" || !/^[0-9a-f-]{36}$/i.test(anonId)) {
      return sendJson(res, 400, { ok: false, code: "invalid_session" });
    }
    if (isRateLimited(anonHits, ip, ANON_WINDOW_MS, ANON_MAX_REQ)) {
      return sendJson(res, 429, { ok: false, code: "rate_limited_device" });
    }

    let session;
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const existingCount = await supabaseAdmin.countSessionsFromIp(ipHash, since);
      // Only the *creation* of a brand-new anon_id is capped per IP — an
      // already-known anon_id continuing its own scans doesn't add to this.
      const isLikelyNew = existingCount === 0; // best-effort; exact existence check happens in touchAnonSession
      if (isLikelyNew && existingCount >= IP_NEW_SESSION_CAP_PER_DAY) {
        return sendJson(res, 429, { ok: false, code: "rate_limited_network" });
      }
      session = await supabaseAdmin.touchAnonSession({ anonId, ipHash, uaHash: hashValue(req.headers["user-agent"] || "", ipHashSalt) });
    } catch (err) {
      console.error("touchAnonSession failed", err);
      return sendJson(res, 502, { ok: false, code: "generic_error" });
    }

    if ((session?.scan_count ?? 0) > ANON_LIFETIME_SCAN_CAP) {
      return sendJson(res, 200, { ok: true, mode: "anon", limit_reached: true, code: "scan_limit_reached" });
    }

    const outcome = await callAnalyzeMcu({ my20fitOrigin, dataUrl: body.file, mime });
    await supabaseAdmin.logAiAccess({ authUserId: null, route: "/api/scan", ok: outcome.ok, errCode: outcome.ok ? null : String(outcome.status) });
    if (!outcome.ok) return sendJson(res, outcome.status, { ok: false, code: outcome.code });

    const teaser = deriveTeaser(outcome.result, lang);
    let pending;
    try {
      pending = await supabaseAdmin.insertPendingScan({ anonId, result: outcome.result, teaser });
    } catch (err) {
      console.error("insertPendingScan failed", err);
      return sendJson(res, 502, { ok: false, code: "save_pending_failed" });
    }

    return sendJson(res, 200, { ok: true, mode: "anon", scan_id: pending.id, teaser });
  }

  async function handleClaim(req, res) {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, err.status || 400, { ok: false, code: err.code || "invalid_request" });
    }

    const token = bearerToken(req);
    const user = token ? await supabaseAdmin.verifyUser(token) : null;
    if (!user) {
      return sendJson(res, 401, { ok: false, code: "auth_session_expired", session_expired: true });
    }

    const anonId = typeof body.anon_id === "string" ? body.anon_id : null;
    const scanId = typeof body.scan_id === "string" ? body.scan_id : null;
    if (!anonId || !scanId) {
      return sendJson(res, 400, { ok: false, code: "incomplete_scan_data" });
    }

    const pending = await supabaseAdmin.claimPendingScan({ scanId, anonId });
    if (!pending) {
      return sendJson(res, 404, { ok: false, code: "pending_scan_expired" });
    }

    try {
      await supabaseAdmin.insertMcuResult({ authUserId: user.id, result: pending.result });
      await supabaseAdmin.markSessionConverted({ anonId, userId: user.id });
    } catch (err) {
      console.error("claim insertMcuResult failed", err);
      return sendJson(res, 502, { ok: false, code: "claim_save_failed" });
    }

    return sendJson(res, 200, { ok: true, result: pending.result });
  }

  return { handleScan, handleClaim };
}
