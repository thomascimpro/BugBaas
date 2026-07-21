import assert from "node:assert/strict";
import test from "node:test";
import { resolveForegroundCatchViewport } from "./foregroundCatchLayout.ts";

test("web foreground movement uses the measured app shell instead of the full browser", () => {
  assert.deepEqual(
    resolveForegroundCatchViewport(
      { height: 900, width: 1440 },
      { height: 844, width: 460 },
      true
    ),
    { height: 844, width: 460 }
  );
});

test("native foreground movement keeps using the window dimensions", () => {
  assert.deepEqual(
    resolveForegroundCatchViewport(
      { height: 844, width: 390 },
      { height: 800, width: 360 },
      false
    ),
    { height: 844, width: 390 }
  );
});
