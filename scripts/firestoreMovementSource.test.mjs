import assert from "node:assert/strict";
import test from "node:test";
import { canRegisterMovementSource } from "../src/services/movementSyncSource.ts";

test("connected FitnessSyncer blocks Health Connect kilometer registration", () => {
  assert.equal(canRegisterMovementSource("health_connect", true), false);
  assert.equal(canRegisterMovementSource("fitness_syncer", true), true);
});
