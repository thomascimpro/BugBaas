import assert from "node:assert/strict";
import test from "node:test";
import {
  fallbackRealBugPhotoPlan,
  primaryRealBugPhotoPlan,
  reviewRealBugThumbnailPlan,
  shouldFallbackRealBugPhoto
} from "./realBugScanImagePolicy.ts";

test("keeps enough landscape detail for reliable AI identification", () => {
  assert.deepEqual(primaryRealBugPhotoPlan(4032, 3024), {
    resize: [{ resize: { width: 1536 } }],
    quality: 0.9
  });
});

test("keeps enough portrait detail for reliable AI identification", () => {
  assert.deepEqual(primaryRealBugPhotoPlan(3024, 4032), {
    resize: [{ resize: { height: 1536 } }],
    quality: 0.9
  });
});

test("does not upscale photos that are already small", () => {
  assert.deepEqual(primaryRealBugPhotoPlan(640, 480), {
    resize: [],
    quality: 0.9
  });
});

test("uses a high-detail fallback that stays below the API payload limit", () => {
  assert.deepEqual(fallbackRealBugPhotoPlan(4032, 3024), {
    resize: [{ resize: { width: 1280 } }],
    quality: 0.8
  });
});

test("creates a 320 pixel low-quality review thumbnail", () => {
  assert.deepEqual(reviewRealBugThumbnailPlan(2000, 1000), {
    resize: [{ resize: { width: 320 } }],
    quality: 0.35
  });
});

test("falls back only above four megabytes of decoded image data", () => {
  const exactlyFourMbBase64 = "a".repeat(Math.ceil((4 * 1024 * 1024 * 4) / 3));
  const aboveFourMbBase64 = "a".repeat(Math.ceil(((4 * 1024 * 1024) + 1) * 4 / 3));

  assert.equal(shouldFallbackRealBugPhoto(exactlyFourMbBase64), false);
  assert.equal(shouldFallbackRealBugPhoto(aboveFourMbBase64), true);
});
