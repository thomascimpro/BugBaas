import assert from "node:assert/strict";
import test from "node:test";
import { canRegisterMovementSource } from "./movementSyncSource.ts";

test("Health Connect is the only source when FitnessSyncer is disconnected", () => {
  assert.equal(canRegisterMovementSource("health_connect", false), true);
  assert.equal(canRegisterMovementSource("fitness_syncer", false), false);
});

test("FitnessSyncer is the only source when it is connected", () => {
  assert.equal(canRegisterMovementSource("fitness_syncer", true), true);
  assert.equal(canRegisterMovementSource("health_connect", true), false);
});
