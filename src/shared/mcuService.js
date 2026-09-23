// Shared MCU data-access — the ONE source of truth for reading/writing a
// member's Medical Check-Up scans. Meant to be byte-for-byte identical in
// medicalscanner.20fit.id AND my.20fit.id/mcu, so both surfaces stay in sync
// automatically: they hit the SAME Supabase table under the SAME member
// session. There is no separate store, no sync job, no duplicate table.
//
// Store: public.my20fit_mcu_result — one row per scan, the full analysis kept
// in a JSONB `result` column (§4 shape: patient_name, grade, metrics[], …).
// RLS enforces `auth.uid() = auth_user_id`, so every call below is already
// scoped to the signed-in member; the explicit user filters are belt-and-
// suspenders (and let the query use the user index).
//
// Zero build dependencies: this takes an already-created @supabase/supabase-js
// client (v2) — it never imports one — so it runs unchanged in any bundler or,
// as here, from a plain ESM <script type="module">. All DB concerns live here;
// callers own their own DOM/rendering.

const TABLE = "my20fit_mcu_result";

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {{
 *   saveScan(result: object, opts?: {filePath?: string}): Promise<{ok: boolean, id?: string|null, code?: string, error?: any}>,
 *   getScanHistory(opts?: {limit?: number, offset?: number}): Promise<{scans: object[], total: number, error?: any}>,
 *   getScanDetail(id: string): Promise<object|null>,
 *   deleteScan(id: string): Promise<{ok: boolean, code?: string, error?: any}>,
 *   getScanStats(): Promise<{totalScans: number, latestScan: object|null}>,
 * }}
 */
export function createMcuService(supabase) {
  if (!supabase) throw new Error("createMcuService: a Supabase client is required");

  // Network-validated identity for writes (re-checks the token server-side,
  // matching the app's prior save path). Null when there is no member.
  async function authedUserId() {
    const { data } = await supabase.auth.getUser();
    return data && data.user ? data.user.id : null;
  }

  // Local (no round-trip) identity for reads — the session already carries the
  // user id, and RLS is the real guard on the query itself.
  async function sessionUserId() {
    const { data } = await supabase.auth.getSession();
    return data && data.session && data.session.user ? data.session.user.id : null;
  }

  // Persist one completed analysis. Never fabricates anything: it stores the
  // result object exactly as produced upstream. Multiple scans per member are
  // allowed (no upsert, no unique-user constraint) — every scan is its own row.
  async function saveScan(result, opts = {}) {
    const userId = await authedUserId();
    if (!userId) return { ok: false, code: "auth_required" };

    const row = {
      auth_user_id: userId,
      result,
      analyzed_at: new Date().toISOString(),
    };
    if (typeof opts.filePath === "string" && opts.filePath) row.file_path = opts.filePath;

    const { data, error } = await supabase.from(TABLE).insert(row).select("id").single();
    if (error) return { ok: false, code: "save_failed", error };
    return { ok: true, id: data ? data.id : null };
  }

  // Most-recent-first page of the member's own scans. Each row already carries
  // the full `result`, so no second fetch is needed to render a card.
  async function getScanHistory(opts = {}) {
    const limit = Number.isFinite(opts.limit) ? opts.limit : 20;
    const offset = Number.isFinite(opts.offset) ? opts.offset : 0;

    const userId = await sessionUserId();
    if (!userId) return { scans: [], total: 0 };

    const { data, count, error } = await supabase
      .from(TABLE)
      .select("id, result, analyzed_at, created_at", { count: "exact" })
      .eq("auth_user_id", userId)
      .order("analyzed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return { scans: [], total: 0, error };
    return { scans: data || [], total: typeof count === "number" ? count : (data ? data.length : 0) };
  }

  // One scan by id (RLS still scopes it to the owner). Returns null if missing
  // or not the member's — callers treat null as "not found".
  async function getScanDetail(id) {
    if (!id) return null;
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, result, analyzed_at, created_at, file_path")
      .eq("id", id)
      .single();
    if (error) return null;
    return data || null;
  }

  async function deleteScan(id) {
    if (!id) return { ok: false, code: "no_id" };
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return { ok: false, code: "delete_failed", error };
    return { ok: true };
  }

  // Small rollup for a profile/summary card: how many scans, and the latest one
  // (raw row — callers derive their own status tally from result.metrics).
  async function getScanStats() {
    const userId = await sessionUserId();
    if (!userId) return { totalScans: 0, latestScan: null };

    const { count } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("auth_user_id", userId);

    const { data } = await supabase
      .from(TABLE)
      .select("id, result, analyzed_at, created_at")
      .eq("auth_user_id", userId)
      .order("analyzed_at", { ascending: false })
      .limit(1);

    return {
      totalScans: typeof count === "number" ? count : 0,
      latestScan: data && data.length ? data[0] : null,
    };
  }

  return { saveScan, getScanHistory, getScanDetail, deleteScan, getScanStats };
}
