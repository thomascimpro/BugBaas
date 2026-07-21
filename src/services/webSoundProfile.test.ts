import assert from "node:assert/strict";
import test from "node:test";
import { webSoundProfile, webUiSoundTargetSelector, webUiTapProfile } from "./webSoundProfile.ts";

const names = [
  "arcade_build",
  "arcade_finish",
  "arcade_hit",
  "arcade_pickup",
  "arcade_start",
  "arcade_tap",
  "bug_hit",
  "bug_catch",
  "bug_unlock",
  "bug_rare_unlock",
  "spray_hit",
  "spray_start"
] as const;

test("every existing BugBaas sound has a short safe web audio profile", () => {
  names.forEach((name) => {
    const profile = webSoundProfile(name);
    assert.ok(profile.frequency >= 80 && profile.frequency <= 1800);
    assert.ok(profile.durationMs >= 20 && profile.durationMs <= 500);
    assert.ok(profile.gain > 0 && profile.gain <= 0.12);
  });
});

test("generic interface taps stay quieter and shorter than reward sounds", () => {
  const reward = webSoundProfile("bug_rare_unlock");
  assert.ok(webUiTapProfile.durationMs < reward.durationMs);
  assert.ok(webUiTapProfile.gain < reward.gain);
});

test("the global web sound listener includes React Native Web Pressables", () => {
  assert.match(webUiSoundTargetSelector, /tabindex/);
  assert.match(webUiSoundTargetSelector, /role=\"button\"/);
});
