import assert from "node:assert/strict";
import test from "node:test";
import { shouldUseNativeGoogleSignIn } from "./googleSignInPlatformPolicy.ts";

test("never initializes native Google Sign-In on web", () => {
  assert.equal(shouldUseNativeGoogleSignIn("web", null), false);
  assert.equal(shouldUseNativeGoogleSignIn("web", "standalone"), false);
});

test("keeps native Google Sign-In for standalone Android", () => {
  assert.equal(shouldUseNativeGoogleSignIn("android", "standalone"), true);
});

test("does not initialize native Google Sign-In inside Expo Go", () => {
  assert.equal(shouldUseNativeGoogleSignIn("android", "expo"), false);
});
