import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import ts from "typescript";

async function importTypeScript(relativePath) {
  const url = new URL(relativePath, pathToFileURL(`${process.cwd()}/`));
  const source = await readFile(url, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const tower = await importTypeScript("src/components/minigames/bugTowerLogic.ts");
const bubbles = await importTypeScript("src/components/minigames/bubbleSwarmLogic.ts");

assert.ok(tower.towerJumpVelocity(720) < tower.towerJumpVelocity(80), "long holds must jump higher");
assert.ok(tower.towerJumpVelocity(80) < -1.8, "short taps must still produce a useful jump");
assert.ok(tower.towerPlatformWidth(1, 0.5) > tower.towerPlatformWidth(24, 0.5), "platforms must shrink by floor");
assert.ok(tower.towerPlatformWidth(24, 0.5) > tower.towerPlatformWidth(56, 0.5), "late platforms must keep shrinking");
assert.ok(tower.towerPlatformGap(56, 0.5) > tower.towerPlatformGap(1, 0.5), "platform gaps must grow");
assert.ok(tower.towerDifficulty(48, 90000).scrollSpeed > tower.towerDifficulty(8, 0).scrollSpeed, "scroll pressure must clearly rise");

const placed = { col: 1, id: "placed", kind: "red", row: 1 };
const matchBoard = [
  { col: 0, id: "red-a", kind: "red", row: 0 },
  { col: 1, id: "red-b", kind: "red", row: 0 },
  placed,
  { col: 1, id: "loose-blue", kind: "blue", row: 2 },
  { col: 6, id: "safe-green", kind: "green", row: 0 }
];
const match = bubbles.resolveBubbleMatch(matchBoard, placed);
assert.equal(match.popped, 3, "three connected bubbles must pop");
assert.equal(match.dropped, 1, "unsupported bubbles must fall");
assert.deepEqual(match.board.map((bubble) => bubble.id), ["safe-green"], "supported bubbles must remain");

const noMatchPlaced = { col: 1, id: "second-red", kind: "red", row: 1 };
const noMatchBoard = [{ col: 0, id: "first-red", kind: "red", row: 0 }, noMatchPlaced];
const noMatch = bubbles.resolveBubbleMatch(noMatchBoard, noMatchPlaced);
assert.equal(noMatch.popped, 0, "two bubbles must not pop");
assert.equal(noMatch.board.length, 2, "non-matches must remain on the board");

console.log("Arcade gameplay tests passed: tower charge/difficulty and bubble match/drop logic.");
