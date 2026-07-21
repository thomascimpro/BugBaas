import assert from "node:assert/strict";
import test from "node:test";
import { refundRealBugScanUsage, reserveRealBugScanUsage } from "./realBugScanUsage.ts";

test("reserves one of three daily scans", () => {
  assert.deepEqual(reserveRealBugScanUsage(0), { used: 1, remaining: 2 });
  assert.deepEqual(reserveRealBugScanUsage(2), { used: 3, remaining: 0 });
});

test("rejects a fourth daily scan", () => {
  assert.throws(() => reserveRealBugScanUsage(3), /daglimiet/i);
});

test("refunds only one reserved scan and never becomes negative", () => {
  assert.equal(refundRealBugScanUsage(3), 2);
  assert.equal(refundRealBugScanUsage(0), 0);
});
