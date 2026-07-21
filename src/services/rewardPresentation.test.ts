import assert from "node:assert/strict";
import test from "node:test";
import { shouldPresentBugDexDropImmediately } from "./rewardPresentation.ts";

test("daily mission claim rewards use the roaming foreground catch first", () => {
  assert.equal(shouldPresentBugDexDropImmediately("daily_mission_bonus"), false);
});

test("ordinary activity drops keep the roaming catch presentation", () => {
  assert.equal(shouldPresentBugDexDropImmediately("comment"), false);
  assert.equal(shouldPresentBugDexDropImmediately("bug_reported"), false);
});
