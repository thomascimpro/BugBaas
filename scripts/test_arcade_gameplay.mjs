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
assert.ok(tower.towerPlatformWidth(1, 0.5) > tower.towerPlatformWidth(100, 0.5), "platforms must shrink gradually by floor");
assert.ok(tower.towerPlatformWidth(100, 0.5) > 50, "floor 100 must still have generous platforms");
assert.ok(tower.towerPlatformWidth(100, 0.5) > tower.towerPlatformWidth(350, 0.5), "late platforms must keep shrinking");
assert.ok(tower.towerPlatformGap(350, 0.5) > tower.towerPlatformGap(1, 0.5), "platform gaps must grow");
assert.ok(tower.towerDifficulty(40, 0).movingEvery > tower.towerDifficulty(350, 0).movingEvery, "moving platforms must become more common with height");
assert.ok(tower.towerDifficulty(20, 120000).scrollSpeed > tower.towerDifficulty(20, 20000).scrollSpeed, "scroll pressure must accelerate over time");
assert.equal(tower.towerZoneIndex(99), 0, "the ice zone must last through floor 99");
assert.equal(tower.towerZoneIndex(100), 1, "a new background must start at floor 100");
assert.equal(tower.towerZoneIndex(400), 4, "all five backgrounds must be reachable");
assert.equal(tower.towerHeightScore(42, 3), 4650, "tower score must use height and combo only");

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

assert.deepEqual(bubbles.bubbleAvailableKinds([
  { kind: "red" }, { kind: "blue" }, { kind: "red" }
]), ["red", "blue"], "shots must only use colors that remain on the board");
const bouncedPath = bubbles.bubbleAimPath({ x: 50, y: 91 }, { x: 5, y: 60 }, 8);
assert.equal(bouncedPath.length, 3, "steep side shots must include a wall bounce");
assert.ok(bouncedPath[1].x === 5 || bouncedPath[1].x === 95, "the bounce point must touch a side wall");
assert.ok(bouncedPath[1].y > 5 && bouncedPath[1].y < 91, "the bounce point must stay inside the playfield");

console.log("Arcade gameplay tests passed: tower balance/zones/score and fair bubble aim/match logic.");
