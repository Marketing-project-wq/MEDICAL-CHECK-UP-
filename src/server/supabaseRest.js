// Minimal, dependency-free Supabase REST helpers for the server.
// Uses PostgREST (service role — bypasses RLS) and the Auth API directly via
// fetch, so no @supabase/supabase-js is needed server-side (keeps this app
// zero-dependency; the browser client still loads supabase-js from a CDN).

export function createSupabaseAdmin({ url, serviceRoleKey, anonKey }) {
  const restBase = `${url}/rest/v1`;
  const authBase = `${url}/auth/v1`;

  async function serviceFetch(path, options = {}) {
    const res = await fetch(`${restBase}${path}`, {
      ...options,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    return res;
  }

  return {
    /** Verifies a Supabase access token via the Auth API (anon key is enough for this). */
    async verifyUser(accessToken) {
      try {
        const res = await fetch(`${authBase}/user`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return null;
        const user = await res.json();
        return user && user.id ? user : null;
      } catch {
        return null;
      }
    },

    /** Upserts an anonymous session row, incrementing scan_count. Returns the row. */
    async touchAnonSession({ anonId, ipHash, uaHash }) {
      // Read-modify-write: PostgREST upsert can't do "increment", so read first.
      const getRes = await serviceFetch(`/my20fit_anonymous_sessions?anon_id=eq.${anonId}&select=anon_id,scan_count`);
      const existing = getRes.ok ? await getRes.json() : [];
      const nextCount = (existing[0]?.scan_count ?? 0) + 1;

      const res = await serviceFetch(`/my20fit_anonymous_sessions?on_conflict=anon_id`, {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify([
          {
            anon_id: anonId,
            ip_hash: ipHash,
            ua_hash: uaHash,
            scan_count: nextCount,
            last_seen_at: new Date().toISOString(),
          },
        ]),
      });
      if (!res.ok) throw new Error(`touchAnonSession failed: ${res.status} ${await res.text()}`);
      const rows = await res.json();
      return rows[0];
    },

    /** Counts distinct anon_id rows first seen from this ip_hash within `sinceIso`. */
    async countSessionsFromIp(ipHash, sinceIso) {
      const res = await serviceFetch(
        `/my20fit_anonymous_sessions?ip_hash=eq.${ipHash}&first_seen_at=gte.${encodeURIComponent(sinceIso)}&select=anon_id`,
      );
      if (!res.ok) return 0;
      const rows = await res.json();
      return rows.length;
    },

    async insertPendingScan({ anonId, result, teaser }) {
      const res = await serviceFetch(`/my20fit_mcu_pending_scan`, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify([{ anon_id: anonId, result, teaser }]),
      });
      if (!res.ok) throw new Error(`insertPendingScan failed: ${res.status} ${await res.text()}`);
      const rows = await res.json();
      return rows[0];
    },

    /** Atomically deletes and returns a pending scan iff it matches anon_id and hasn't expired. */
    async claimPendingScan({ scanId, anonId }) {
      const res = await serviceFetch(
        `/my20fit_mcu_pending_scan?id=eq.${scanId}&anon_id=eq.${anonId}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`,
        { method: "DELETE", headers: { Prefer: "return=representation" } },
      );
      if (!res.ok) return null;
      const rows = await res.json();
      return rows[0] ?? null;
    },

    async markSessionConverted({ anonId, userId }) {
      await serviceFetch(`/my20fit_anonymous_sessions?anon_id=eq.${anonId}`, {
        method: "PATCH",
        body: JSON.stringify({ converted_user_id: userId }),
      });
    },

    async insertMcuResult({ authUserId, result }) {
      const res = await serviceFetch(`/my20fit_mcu_result`, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify([{ auth_user_id: authUserId, result, analyzed_at: new Date().toISOString() }]),
      });
      if (!res.ok) throw new Error(`insertMcuResult failed: ${res.status} ${await res.text()}`);
      const rows = await res.json();
      return rows[0];
    },

    async logAiAccess({ authUserId, route, ok, errCode }) {
      try {
        await serviceFetch(`/my20fit_ai_access_log`, {
          method: "POST",
          body: JSON.stringify([{ auth_user_id: authUserId ?? null, route, ok, err_code: errCode ?? null }]),
        });
      } catch {
        /* logging is best-effort */
      }
    },
  };
}
