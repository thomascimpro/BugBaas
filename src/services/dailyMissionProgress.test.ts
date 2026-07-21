import assert from "node:assert/strict";
import test from "node:test";
// @ts-ignore Node's strip-types runner requires the .ts extension.
import { completedDailyArcadeModes, dailyArcadeModes } from "./dailyMissionProgress.ts";
import type { BugSmashDuel } from "../types";

function score(submittedAt: string) {
  return { bonusScore: 0, caughtBugIds: [], score: 1, submittedAt };
}

function duel(overrides: Partial<BugSmashDuel>): BugSmashDuel {
  return {
    id: Math.random().toString(36),
    fromUserId: "user-1",
    toUserId: "user-2",
    scores: {},
    status: "completed",
    ...overrides
  } as BugSmashDuel;
}

test("daily arcade progress lists each completed game once for the current user and day", () => {
  const today = new Date(2026, 6, 21, 10, 0, 0);
  const submittedToday = new Date(2026, 6, 21, 9, 0, 0).toISOString();
  const submittedYesterday = new Date(2026, 6, 20, 9, 0, 0).toISOString();
  const duels = [
    duel({ arcadeMode: "web_runner", scores: { "user-1": score(submittedToday) } }),
    duel({ arcadeMode: "web_runner", scores: { "user-1": score(submittedToday) } }),
    duel({ arcadeMode: "nest_defense", fromUserId: "user-2", toUserId: "user-1", scores: { "user-1": score(submittedToday) } }),
    duel({ scores: { "user-1": score(submittedToday) } }),
    duel({ arcadeMode: "bubble_swarm", scores: { "user-1": score(submittedYesterday) } }),
    duel({ arcadeMode: "bug_tower", fromUserId: "user-2", toUserId: "user-3", scores: { "user-1": score(submittedToday) } })
  ];

  assert.deepEqual(dailyArcadeModes, ["tap_duel", "web_runner", "nest_defense", "bug_glide", "bug_tower", "bubble_swarm"]);
  assert.deepEqual(completedDailyArcadeModes("user-1", duels, today), ["tap_duel", "web_runner", "nest_defense"]);
});
