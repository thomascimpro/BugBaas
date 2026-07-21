import assert from "node:assert/strict";
import test from "node:test";
import { isDailyRealBugScanSuccess } from "./realBugScanProgressPolicy.ts";

test("counts classified real bug results for the daily mission", () => {
  assert.equal(isDailyRealBugScanSuccess("matched"), true);
  assert.equal(isDailyRealBugScanSuccess("already_spotted"), true);
  assert.equal(isDailyRealBugScanSuccess("not_in_catalog"), true);
});

test("does not count inconclusive or rejected photos for the daily mission", () => {
  assert.equal(isDailyRealBugScanSuccess("pending_review"), false);
  assert.equal(isDailyRealBugScanSuccess("rejected_no_bug"), false);
  assert.equal(isDailyRealBugScanSuccess("rejected_quality"), false);
});
