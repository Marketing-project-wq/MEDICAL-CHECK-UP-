import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeMetrics, attentionFilterUseful } from "../src/shared/mcuSummary.js";

test("summarizeMetrics tallies each status bucket and the attention total", () => {
  const metrics = [
    { status: "ok" },
    { status: "ok" },
    { status: "high" },
    { status: "low" },
    { status: "warning" },
    { status: "weird" }, // unrecognized -> unknown
    {}, // missing status -> unknown
  ];
  const s = summarizeMetrics(metrics);
  assert.equal(s.total, 7);
  assert.equal(s.ok, 2);
  assert.equal(s.high, 1);
  assert.equal(s.low, 1);
  assert.equal(s.warning, 1);
  assert.equal(s.unknown, 2);
  assert.equal(s.attention, 3, "high + low + warning");
});

test("summarizeMetrics never throws on non-array / junk input", () => {
  for (const bad of [null, undefined, {}, "x", 5, NaN]) {
    const s = summarizeMetrics(bad);
    assert.equal(s.total, 0);
    assert.equal(s.attention, 0);
  }
});

test("attentionFilterUseful is true only when there is a mix to filter", () => {
  assert.equal(attentionFilterUseful({ total: 10, attention: 3 }), true);
  assert.equal(attentionFilterUseful({ total: 3, attention: 3 }), false, "all flagged -> nothing to hide");
  assert.equal(attentionFilterUseful({ total: 5, attention: 0 }), false, "none flagged -> nothing to show");
  assert.equal(attentionFilterUseful({ total: 0, attention: 0 }), false);
  assert.equal(attentionFilterUseful(null), false);
});
