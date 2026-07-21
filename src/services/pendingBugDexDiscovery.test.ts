import assert from "node:assert/strict";
import test from "node:test";
import { buildPendingBugDexDiscoveryRecord, normalizePendingSpeciesKey } from "./pendingBugDexDiscovery.ts";

const user = {
  uid: "user-1",
  displayName: "Thomas",
  email: "thomas@example.com",
  organizationId: "org-1",
  totalPoints: 0,
  bugCount: 0,
  title: "Tester",
  badges: []
};

const identification = {
  bugId: null,
  commonName: "Aziatisch lieveheersbeestje",
  scientificName: "Harmonia axyridis",
  confidence: 0.92,
  reason: "De soort staat niet in de huidige BugDex."
};

test("normalizes a stable species key", () => {
  assert.equal(normalizePendingSpeciesKey("Harmonia axyridis"), "harmonia-axyridis");
});

test("builds an immutable reward owed record", () => {
  const record = buildPendingBugDexDiscoveryRecord({
    user,
    scanId: "realbug_12345678",
    identification,
    reviewThumbnailDataUrl: "data:image/jpeg;base64,YWJjZA==",
    now: "2026-07-20T12:00:00.000Z"
  });

  assert.equal(record.status, "reward_owed");
  assert.equal(record.userId, "user-1");
  assert.equal(record.normalizedSpeciesKey, "harmonia-axyridis");
  assert.equal(record.bugDexBugId, null);
  assert.equal(record.createdAt, record.updatedAt);
});

test("rejects oversized review thumbnails", () => {
  assert.throws(() => buildPendingBugDexDiscoveryRecord({
    user,
    scanId: "realbug_12345678",
    identification,
    reviewThumbnailDataUrl: `data:image/jpeg;base64,${"a".repeat(220001)}`
  }), /thumbnail/i);
});
