import { test } from "node:test";
import assert from "node:assert/strict";
import { createMcuService } from "../src/shared/mcuService.js";

// A tiny stand-in for a @supabase/supabase-js query builder: every method is
// chainable, and the chain resolves — whether awaited directly (thenable) or
// via .single() — to whatever `resolver(table, calls)` returns. `calls` is the
// recorded chain, so a test can both control the response and assert the query.
function makeQuery(resolver) {
  const calls = [];
  const q = {};
  const rec = (name) => (...args) => {
    calls.push([name, ...args]);
    return q;
  };
  q.insert = rec("insert");
  q.delete = rec("delete");
  q.select = rec("select");
  q.eq = rec("eq");
  q.order = rec("order");
  q.range = rec("range");
  q.limit = rec("limit");
  q.single = () => {
    calls.push(["single"]);
    return Promise.resolve(resolver(calls));
  };
  q.then = (onF, onR) => Promise.resolve(resolver(calls)).then(onF, onR);
  q._calls = calls;
  return q;
}

function makeSupabase({ user = { id: "u1" }, session = "default", resolver, onFrom } = {}) {
  const sess = session === "default" ? (user ? { user } : null) : session;
  return {
    auth: {
      getUser: async () => ({ data: { user: user || null } }),
      getSession: async () => ({ data: { session: sess } }),
    },
    from() {
      const q = makeQuery(resolver);
      if (onFrom) onFrom(q);
      return q;
    },
  };
}

const hasCall = (calls, name) => calls.some((c) => c[0] === name);
const findCall = (calls, name) => calls.find((c) => c[0] === name);

test("createMcuService throws without a client", () => {
  assert.throws(() => createMcuService(null), /Supabase client is required/);
});

test("saveScan inserts the member's row and returns the new id", async () => {
  let inserted = null;
  const supabase = makeSupabase({
    user: { id: "user-123" },
    resolver: (calls) => {
      const ins = findCall(calls, "insert");
      if (ins) {
        inserted = ins[1];
        return { data: { id: "scan-9" }, error: null };
      }
      return { data: null, error: null };
    },
  });
  const res = await createMcuService(supabase).saveScan({ grade: "B", metrics: [] });

  assert.deepEqual(res, { ok: true, id: "scan-9" });
  assert.equal(inserted.auth_user_id, "user-123");
  assert.deepEqual(inserted.result, { grade: "B", metrics: [] });
  assert.ok(inserted.analyzed_at, "sets analyzed_at");
  assert.ok(!("file_path" in inserted), "no file_path when none is given");
});

test("saveScan records file_path only when provided", async () => {
  let inserted = null;
  const supabase = makeSupabase({
    resolver: (calls) => {
      const ins = findCall(calls, "insert");
      if (ins) inserted = ins[1];
      return { data: { id: "x" }, error: null };
    },
  });
  await createMcuService(supabase).saveScan({ grade: "A" }, { filePath: "u/scan.jpg" });
  assert.equal(inserted.file_path, "u/scan.jpg");
});

test("saveScan refuses when there is no member (never writes)", async () => {
  let wrote = false;
  const supabase = makeSupabase({
    user: null,
    resolver: (calls) => {
      if (hasCall(calls, "insert")) wrote = true;
      return { data: null, error: null };
    },
  });
  const res = await createMcuService(supabase).saveScan({ grade: "A" });
  assert.deepEqual(res, { ok: false, code: "auth_required" });
  assert.equal(wrote, false);
});

test("saveScan surfaces a DB error as save_failed", async () => {
  const supabase = makeSupabase({
    resolver: () => ({ data: null, error: { message: "boom" } }),
  });
  const res = await createMcuService(supabase).saveScan({ grade: "C" });
  assert.equal(res.ok, false);
  assert.equal(res.code, "save_failed");
  assert.ok(res.error, "passes the raw error through");
});

test("getScanHistory returns {scans,total}, scoped + ordered + paged", async () => {
  let seen = null;
  const supabase = makeSupabase({
    user: { id: "user-7" },
    onFrom: (q) => {
      seen = q;
    },
    resolver: () => ({ data: [{ id: "a" }, { id: "b" }], count: 2, error: null }),
  });
  const res = await createMcuService(supabase).getScanHistory({ limit: 20 });

  assert.equal(res.total, 2);
  assert.equal(res.scans.length, 2);
  // The query is scoped to the member, newest first, first page of 20.
  assert.deepEqual(findCall(seen._calls, "eq"), ["eq", "auth_user_id", "user-7"]);
  assert.deepEqual(findCall(seen._calls, "order"), ["order", "analyzed_at", { ascending: false }]);
  assert.deepEqual(findCall(seen._calls, "range"), ["range", 0, 19]);
});

test("getScanHistory honors offset paging", async () => {
  let seen = null;
  const supabase = makeSupabase({
    onFrom: (q) => (seen = q),
    resolver: () => ({ data: [], count: 0, error: null }),
  });
  await createMcuService(supabase).getScanHistory({ limit: 10, offset: 30 });
  assert.deepEqual(findCall(seen._calls, "range"), ["range", 30, 39]);
});

test("getScanHistory returns empty for a signed-out visitor (no query)", async () => {
  let queried = false;
  const supabase = makeSupabase({
    user: null,
    session: null,
    onFrom: () => (queried = true),
    resolver: () => ({ data: [], count: 0, error: null }),
  });
  const res = await createMcuService(supabase).getScanHistory();
  assert.deepEqual(res, { scans: [], total: 0 });
  assert.equal(queried, false);
});

test("getScanDetail returns the row, or null on error", async () => {
  const ok = makeSupabase({ resolver: () => ({ data: { id: "s1", result: {} }, error: null }) });
  assert.deepEqual(await createMcuService(ok).getScanDetail("s1"), { id: "s1", result: {} });

  const missing = makeSupabase({ resolver: () => ({ data: null, error: { message: "no rows" } }) });
  assert.equal(await createMcuService(missing).getScanDetail("nope"), null);

  const noId = makeSupabase({ resolver: () => ({ data: { id: "x" }, error: null }) });
  assert.equal(await createMcuService(noId).getScanDetail(""), null);
});

test("deleteScan deletes by id and reports ok / failure / missing-id", async () => {
  let seen = null;
  const okClient = makeSupabase({ onFrom: (q) => (seen = q), resolver: () => ({ error: null }) });
  assert.deepEqual(await createMcuService(okClient).deleteScan("s5"), { ok: true });
  assert.ok(hasCall(seen._calls, "delete"));
  assert.deepEqual(findCall(seen._calls, "eq"), ["eq", "id", "s5"]);

  const failClient = makeSupabase({ resolver: () => ({ error: { message: "denied" } }) });
  const failRes = await createMcuService(failClient).deleteScan("s5");
  assert.equal(failRes.ok, false);
  assert.equal(failRes.code, "delete_failed");

  let touched = false;
  const noIdClient = makeSupabase({ onFrom: () => (touched = true), resolver: () => ({ error: null }) });
  assert.deepEqual(await createMcuService(noIdClient).deleteScan(""), { ok: false, code: "no_id" });
  assert.equal(touched, false, "no DB call without an id");
});

test("getScanStats returns count + latest scan", async () => {
  const supabase = makeSupabase({
    user: { id: "user-42" },
    resolver: (calls) => {
      // head count query vs. the latest-row query, told apart by the chain.
      const sel = findCall(calls, "select");
      const headCount = sel && sel[2] && sel[2].head === true;
      if (headCount) return { count: 3, data: null, error: null };
      return { data: [{ id: "latest", result: { grade: "B" } }], error: null };
    },
  });
  const res = await createMcuService(supabase).getScanStats();
  assert.equal(res.totalScans, 3);
  assert.deepEqual(res.latestScan, { id: "latest", result: { grade: "B" } });
});

test("getScanStats is zero/null when signed out", async () => {
  const supabase = makeSupabase({ user: null, session: null, resolver: () => ({ count: 0, data: [] }) });
  assert.deepEqual(await createMcuService(supabase).getScanStats(), { totalScans: 0, latestScan: null });
});
