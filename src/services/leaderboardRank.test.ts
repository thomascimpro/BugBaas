import assert from "node:assert/strict";
import test from "node:test";
import { mergeRankUsers, rankForMetric, visibleRankUsers } from "./leaderboardRank.ts";

type RankUser = { duelRating?: number; totalPoints: number; uid: string };

const score = (user: RankUser) => user.totalPoints;
const duel = (user: RankUser) => user.duelRating ?? 1000;

test("a user missing from the loaded list is ranked after all higher scores instead of as number one", () => {
  const current = { duelRating: 900, totalPoints: 70, uid: "current" };
  const users = [
    { duelRating: 1200, totalPoints: 100, uid: "a" },
    { duelRating: 1100, totalPoints: 90, uid: "b" },
    { duelRating: 1000, totalPoints: 80, uid: "c" }
  ];

  const merged = mergeRankUsers(users, current);

  assert.equal(rankForMetric(merged, current.uid, score), 4);
  assert.equal(rankForMetric(merged, current.uid, duel), 4);
});

test("the current user snapshot replaces stale leaderboard data before ranking", () => {
  const current = { duelRating: 1400, totalPoints: 150, uid: "current" };
  const users = [
    { duelRating: 1000, totalPoints: 100, uid: "a" },
    { duelRating: 900, totalPoints: 80, uid: "current" }
  ];

  const merged = mergeRankUsers(users, current);

  assert.equal(rankForMetric(merged, current.uid, score), 1);
  assert.equal(rankForMetric(merged, current.uid, duel), 1);
});

test("hidden and normal leaderboard users never mix in either ranking", () => {
  const hiddenCurrent = { duelRating: 1200, testAccount: true, totalPoints: 100, uid: "hidden-current" };
  const mixed = [
    hiddenCurrent,
    { duelRating: 1400, testAccount: true, totalPoints: 120, uid: "hidden-peer" },
    { duelRating: 1800, totalPoints: 999, uid: "normal-peer" }
  ];

  const visible = visibleRankUsers(mixed, hiddenCurrent);

  assert.deepEqual(visible.map((user) => user.uid).sort(), ["hidden-current", "hidden-peer"]);
  assert.equal(rankForMetric(visible, hiddenCurrent.uid, score), 2);
  assert.equal(rankForMetric(visible, hiddenCurrent.uid, duel), 2);
});
