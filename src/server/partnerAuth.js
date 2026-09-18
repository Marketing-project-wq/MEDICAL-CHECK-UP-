// Optional partner API-key auth for POST /api/quiz/submit ONLY.
//
// Scope is deliberately narrow: /api/quiz/submit is the one endpoint whose
// result never belongs to a specific pre-existing identity (it's answerable
// anonymously by design — see quizHandlers.js), so a shared key that
// identifies "which integration is calling" can't leak one person's data to
// another the way it would on /api/scan or /api/quiz/history (both return
// ONE member's own health data — a partner key must never be accepted there).
//
// The header is OPTIONAL and purely additive: existing callers (this site's
// own browser client) never send it and are completely unaffected. When
// present, it must be a currently-active key or the request is rejected —
// never silently ignored, so a typo'd/revoked key fails loudly instead of
// quietly behaving like an anonymous call.
//
// Only a SHA-256 hash of each key is ever stored (public.mcu_quiz_api_keys,
// RLS service-role-only) or compared here; the raw key is never logged.
// Dependency-free ESM.

import crypto from "node:crypto";

export function hashApiKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey, "utf8").digest("hex");
}

export function createPartnerAuth({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
  const restBase = `${String(supabaseUrl).replace(/\/$/, "")}/rest/v1`;

  /**
   * @returns {Promise<{id: string, label: string} | null>} the matching
   *   active key's row, or null if the key is missing/unknown/revoked.
   */
  async function verifyApiKey(rawKey) {
    if (typeof rawKey !== "string" || rawKey.length < 16) return null;
    const hash = hashApiKey(rawKey);
    try {
      const res = await fetchImpl(
        `${restBase}/mcu_quiz_api_keys?key_hash=eq.${hash}&revoked_at=is.null&select=id,label&limit=1`,
        { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
      );
      if (!res.ok) return null;
      const rows = await res.json();
      return Array.isArray(rows) && rows[0] ? rows[0] : null;
    } catch (e) {
      console.error("partnerAuth.verifyApiKey failed:", e.message);
      return null;
    }
  }

  return { verifyApiKey };
}
