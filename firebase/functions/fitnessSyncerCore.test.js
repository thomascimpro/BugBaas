const test = require("node:test");
const assert = require("node:assert/strict");
const { activityDistanceKm, activityImportId, tokenExpiryMs } = require("./fitnessSyncerCore");

test("accepts measured walking, running, and cycling distances", () => {
  assert.equal(activityDistanceKm({ type: "Activity", fitnessSyncerActivity: "Walking", distanceKM: 3.25, itemId: "1" }), 3.25);
  assert.equal(activityDistanceKm({ item: { type: "Activity", activity: "Outdoor Cycling", distanceKM: 12.3456, itemId: "2" } }), 12.346);
});

test("rejects summaries, manual entries, and unsupported activities", () => {
  assert.equal(activityDistanceKm({ type: "Activity", activity: "Walking", distanceKM: 8, summary: true }), 0);
  assert.equal(activityDistanceKm({ type: "Activity", activity: "Running", distanceKM: 8, manual: true }), 0);
  assert.equal(activityDistanceKm({ type: "Activity", activity: "Swimming", distanceKM: 2 }), 0);
});

test("creates stable provider-scoped import ids", () => {
  const item = { type: "Activity", activity: "Walking", distanceKM: 2, itemId: "activity-1" };
  assert.equal(activityImportId("source-a", item), activityImportId("source-a", item));
  assert.notEqual(activityImportId("source-a", item), activityImportId("source-b", item));
});

test("supports both epoch and duration token expiry values", () => {
  const now = 1_800_000_000_000;
  assert.equal(tokenExpiryMs(1_800_003_600, now), 1_800_003_600_000);
  assert.equal(tokenExpiryMs(3600, now), now + 3_600_000);
});
