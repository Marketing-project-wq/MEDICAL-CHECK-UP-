// Minimal, dependency-free Supabase REST helpers for the server.
// Uses PostgREST (service role — bypasses RLS) and the Auth API directly via
// fetch, so no @supabase/supabase-js is needed server-side (keeps this app
// zero-dependency; the browser client still loads supabase-js from a CDN).
//
// Only two helpers are needed now that /api/scan is members-only (spec §0.1):
// verifyUser (authenticate the caller) and logAiAccess (audit trail for every
// AI call on a health document). Members save their own result client-side
// under RLS — the server never writes result rows itself.

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
