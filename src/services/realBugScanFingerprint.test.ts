import assert from "node:assert/strict";
import test from "node:test";
import { realBugScanFingerprint } from "./realBugScanFingerprint.ts";

test("creates a stable fingerprint for the same prepared image", () => {
  const image = "data:image/jpeg;base64,YWJjZA==";
  assert.equal(realBugScanFingerprint(image), realBugScanFingerprint(image));
});

test("creates different fingerprints for different prepared images", () => {
  assert.notEqual(
    realBugScanFingerprint("data:image/jpeg;base64,YWJjZA=="),
    realBugScanFingerprint("data:image/jpeg;base64,ZWZnaA==")
  );
});
