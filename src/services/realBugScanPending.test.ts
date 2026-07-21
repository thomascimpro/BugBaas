import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(currentDirectory, "realBugScanService.ts"), "utf8");

test("an unknown species still returns a result when developer storage fails", () => {
  assert.match(source, /try\s*{\s*await recordPendingBugDexDiscovery\(/s);
  assert.match(source, /catch\s*\([^)]*\)\s*{\s*console\.warn\(/s);
});
