import assert from "node:assert/strict";
import test from "node:test";
import {
  fallbackRealBugPhotoPlan,
  primaryRealBugPhotoPlan,
  reviewRealBugThumbnailPlan,
  shouldFallbackRealBugPhoto
} from "./realBugScanImagePolicy.ts";

test("limits landscape photos to 768 pixels without changing the other axis explicitly", () => {
  assert.deepEqual(primaryRealBugPhotoPlan(4032, 3024), {
    resize: [{ resize: { width: 768 } }],
    quality: 0.6
  });
});

test("limits portrait photos to 768 pixels", () => {
  assert.deepEqual(primaryRealBugPhotoPlan(3024, 4032), {
    resize: [{ resize: { height: 768 } }],
    quality: 0.6
  });
});

test("does not upscale photos that are already small", () => {
  assert.deepEqual(primaryRealBugPhotoPlan(640, 480), {
    resize: [],
    quality: 0.6
  });
});

test("uses a 640 pixel fallback plan", () => {
  assert.deepEqual(fallbackRealBugPhotoPlan(4032, 3024), {
    resize: [{ resize: { width: 640 } }],
    quality: 0.5
  });
});

test("creates a 320 pixel low-quality review thumbnail", () => {
  assert.deepEqual(reviewRealBugThumbnailPlan(2000, 1000), {
    resize: [{ resize: { width: 320 } }],
    quality: 0.35
  });
});

test("falls back only above 750 kilobytes of decoded image data", () => {
  const exactly750KbBase64 = "a".repeat(Math.ceil((750 * 1024 * 4) / 3));
  const above750KbBase64 = "a".repeat(Math.ceil((751 * 1024 * 4) / 3));

  assert.equal(shouldFallbackRealBugPhoto(exactly750KbBase64), false);
  assert.equal(shouldFallbackRealBugPhoto(above750KbBase64), true);
});
