import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRealBugCameraAsset } from "./realBugCameraAsset.ts";

test("normalizes an embedded camera photo for the existing image preparation flow", () => {
  assert.deepEqual(
    normalizeRealBugCameraAsset({ uri: "file:///photo.jpg", width: 1920, height: 1080 }),
    { uri: "file:///photo.jpg", width: 1920, height: 1080 }
  );
});

test("rejects a camera result without a usable uri", () => {
  assert.throws(
    () => normalizeRealBugCameraAsset({ uri: "", width: 0, height: 0 }),
    /cameraresultaat/i
  );
});
