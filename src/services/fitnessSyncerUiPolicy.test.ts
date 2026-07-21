const test = require("node:test");
const assert = require("node:assert/strict");
const { canStartFitnessSyncerConnection, fitnessSyncerCredentialAction } = require("./fitnessSyncerUiPolicy.ts");

test("keeps FitnessSyncer connect enabled unless a request is busy", () => {
  assert.equal(canStartFitnessSyncerConnection(false), true);
  assert.equal(canStartFitnessSyncerConnection(true), false);
});

test("requires both personal OAuth values or an already saved configuration", () => {
  assert.equal(fitnessSyncerCredentialAction("id", "secret", false), "save");
  assert.equal(fitnessSyncerCredentialAction("", "", true), "connect");
  assert.equal(fitnessSyncerCredentialAction("id", "", false), "invalid");
  assert.equal(fitnessSyncerCredentialAction("", "", false), "invalid");
});
