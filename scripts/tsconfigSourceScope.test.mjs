import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const tscPath = fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url));

test("TypeScript excludes generated dist bundles from source scope", () => {
  const output = execFileSync(process.execPath, [tscPath, "--showConfig"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8"
  });
  const config = JSON.parse(output);
  const generatedFiles = (config.files || []).filter((file) => /(^|\/)dist(?:-|\/)/.test(file.replaceAll("\\", "/")));
  assert.deepEqual(generatedFiles, []);
});
