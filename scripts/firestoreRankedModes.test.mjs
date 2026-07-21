import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
const rankedModes = ["tap_duel", "web_runner", "nest_defense", "bug_glide", "bug_tower", "bubble_swarm"];

function functionBody(name) {
  const match = rules.match(new RegExp(`function ${name}\\([^)]*\\) \\{([\\s\\S]*?)\\n    \\}`));
  assert.ok(match, `${name} is present in firestore.rules`);
  return match[1];
}

test("Firestore accepts every ranked mode exposed by the Arena UI", () => {
  const duelModeBody = functionBody("validDuelMode");
  rankedModes.forEach((mode) => assert.match(duelModeBody, new RegExp(`['\"]${mode}['\"]`), `${mode} must be a valid duel mode`));
});

test("Firestore treats every non-tap ranked minigame as an arcade duel", () => {
  const arcadeModeBody = functionBody("validArcadeMode");
  rankedModes.filter((mode) => mode !== "tap_duel").forEach((mode) => {
    assert.match(arcadeModeBody, new RegExp(`['\"]${mode}['\"]`), `${mode} must be a valid arcade mode`);
  });
});
