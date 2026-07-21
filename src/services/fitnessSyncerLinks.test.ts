import assert from "node:assert/strict";
import test from "node:test";
import * as fitnessSyncerLinks from "./fitnessSyncerLinks.ts";

test("FitnessSyncer setup guidance opens the official Developer Accounts page", () => {
  assert.equal(
    fitnessSyncerLinks.fitnessSyncerSetupUrl,
    "https://www.fitnesssyncer.com/account/developer/app"
  );
  assert.equal(
    fitnessSyncerLinks.fitnessSyncerCallbackUrl,
    "https://us-central1-thomascimpro-6266f.cloudfunctions.net/fitnessSyncerCallback"
  );
});

test("FitnessSyncer setup guidance selects the correct health source", () => {
  const setupKeys = fitnessSyncerLinks.fitnessSyncerSetupKeys as undefined | ((platform: "android" | "ios" | "web") => string[]);

  assert.deepEqual(setupKeys?.("android"), [
    "settings.fitnessSetupAndroid",
    "settings.fitnessSetupPermissions",
    "settings.fitnessSetupDeveloper",
    "settings.fitnessSetupConnect",
    "settings.fitnessSetupSync"
  ]);
  assert.equal(setupKeys?.("ios")[0], "settings.fitnessSetupIos");
  assert.equal(setupKeys?.("web")[0], "settings.fitnessSetupWeb");
});
