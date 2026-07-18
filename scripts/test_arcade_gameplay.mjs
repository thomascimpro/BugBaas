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
const tapHeight = tower.towerJumpVelocity(0) ** 2 / (2 * tower.TOWER_GRAVITY);
const fullHoldHeight = tower.towerJumpVelocity(tower.TOWER_MAX_CHARGE_MS) ** 2 / (2 * tower.TOWER_GRAVITY);
assert.ok(tapHeight >= 11 && tapHeight < 15, "a tap must jump roughly one opening stair");
assert.ok(fullHoldHeight >= 61, "a full hold must clear roughly five opening stairs");
assert.ok(fullHoldHeight > tapHeight * 5, "full charge must feel dramatically higher than a tap");
assert.ok(tower.towerPlatformWidth(1, 0.5) < 43, "floor 1 must start around the former floor-150 challenge");
assert.ok(tower.towerPlatformWidth(1, 0.5) > tower.towerPlatformWidth(100, 0.5), "platforms must shrink gradually by floor");
assert.ok(tower.towerPlatformWidth(100, 0.5) < 49, "floor 100 must already demand deliberate landings");
assert.ok(tower.towerPlatformWidth(200, 0.5) < 35, "floor 200 must be sharply narrower");
assert.ok(tower.towerPlatformWidth(100, 0.5) > tower.towerPlatformWidth(350, 0.5), "late platforms must keep shrinking");
assert.ok(tower.towerPlatformGap(350, 0.5) > tower.towerPlatformGap(1, 0.5), "platform gaps must grow");
assert.ok(tower.towerDifficulty(1, 0).movingEvery <= 7, "moving platforms must be possible from the opening climb");
assert.ok(tower.towerDifficulty(1, 0).movingEvery > tower.towerDifficulty(250, 0).movingEvery, "moving platforms must become more common with height");
assert.ok(Math.abs(tower.towerHorizontalOffset(150, 1)) > Math.abs(tower.towerHorizontalOffset(1, 1)), "left-right reach must grow with height");
assert.ok(tower.towerHorizontalOffset(11, 0.5) > 0 && tower.towerHorizontalOffset(12, 0.5) < 0, "platforms must alternate right and left");
assert.ok(tower.towerDifficulty(20, 120000).scrollSpeed > tower.towerDifficulty(20, 20000).scrollSpeed, "scroll pressure must accelerate over time");
assert.ok(tower.towerDifficulty(1, 0).scrollSpeed >= 0.03, "the map must rise immediately at a meaningful speed");
assert.ok(tower.towerDifficulty(1, 90000).scrollSpeed > tower.towerDifficulty(1, 0).scrollSpeed * 2, "late scroll pressure must be more than twice the opening speed");
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

const bombBoard = [
  { col: 0, id: "anchor", kind: "red", row: 0 },
  { col: 1, id: "target", kind: "blue", row: 0 },
  { col: 1, id: "neighbor", kind: "green", row: 1 },
  { col: 5, id: "safe", kind: "yellow", row: 0 }
];
const bomb = bubbles.resolveBubbleBomb(bombBoard, bombBoard[1]);
assert.ok(bomb.cleared >= 2, "a bomb must clear its target and neighboring bubbles");
assert.deepEqual(bomb.board.map((bubble) => bubble.id), ["safe"], "a bomb must keep distant supported bubbles");
assert.equal(bubbles.bubblePressureDelay(0), 17500, "swarm pressure must start quickly");
assert.equal(bubbles.bubblePressureDelay(90000), 6500, "swarm pressure must accelerate sharply over time");
assert.ok(bubbles.bubbleMissLimit(90000) < bubbles.bubbleMissLimit(0), "late play must allow fewer missed shots");

assert.deepEqual(bubbles.bubbleAvailableKinds([
  { kind: "red" }, { kind: "blue" }, { kind: "red" }
]), ["red", "blue"], "shots must only use colors that remain on the board");
const bouncedPath = bubbles.bubbleAimPath({ x: 50, y: 91 }, { x: 5, y: 60 }, 8);
assert.equal(bouncedPath.length, 3, "steep side shots must include a wall bounce");
assert.ok(bouncedPath[1].x === 5 || bouncedPath[1].x === 95, "the bounce point must touch a side wall");
assert.ok(bouncedPath[1].y > 5 && bouncedPath[1].y < 91, "the bounce point must stay inside the playfield");

console.log("Arcade gameplay tests passed: tower balance/zones/score and fair bubble aim/match logic.");
