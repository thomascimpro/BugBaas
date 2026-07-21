import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { bugDexSets, bugDexSetBadgeBugIds } from "./bugDexSetService.ts";
import { bugDexEntries, bugDexFacts } from "./pointsService.ts";

const addedEntries = bugDexEntries.filter((entry) => entry.unlockMode === "drop");
const addedIds = new Set(addedEntries.map((entry) => entry.id));
const catalogIds = new Set(bugDexEntries.map((entry) => entry.id));

test("Dutch BugDex expansion contains the approved 48 drop-only entries", () => {
  assert.equal(addedEntries.length, 48);
  assert.deepEqual(
    Object.fromEntries(["Gewoon", "Zeldzaam", "Episch", "Legendarisch", "Mythisch"].map((rarity) => [rarity, addedEntries.filter((entry) => entry.rarity === rarity).length])),
    { Gewoon: 13, Zeldzaam: 16, Episch: 13, Legendarisch: 6, Mythisch: 0 }
  );
  assert.ok(addedEntries.every((entry) => entry.minPoints === 0 && entry.minBugs === 0));
});

test("every added entry has transparent raster art and a fact", () => {
  const bugArtSource = readFileSync("src/services/bugArt.ts", "utf8");
  for (const entry of addedEntries) {
    const assetPath = `assets/bugdex/${entry.id}.png`;
    const png = readFileSync(assetPath);
    assert.ok(bugArtSource.includes(`"${entry.id}": require("../../${assetPath}")`), `missing raster mapping for ${entry.id}`);
    assert.equal(png.subarray(1, 4).toString("ascii"), "PNG", `${entry.id} is not a PNG`);
    assert.equal(png[25], 6, `${entry.id} PNG is missing an alpha channel`);
    assert.ok(png.readUInt32BE(16) <= 768 && png.readUInt32BE(20) <= 768, `${entry.id} exceeds 768px`);
    assert.ok(bugDexFacts[entry.id]?.length > 20, `missing useful fact for ${entry.id}`);
  }
});

test("all category references point at real BugDex entries", () => {
  for (const set of bugDexSets) {
    assert.equal(new Set(set.bugIds).size, set.bugIds.length, `${set.id} contains duplicate bug IDs`);
    for (const bugId of set.bugIds) assert.ok(catalogIds.has(bugId), `${set.id} references unknown ${bugId}`);
    for (const bugId of bugDexSetBadgeBugIds(set)) assert.ok(catalogIds.has(bugId), `${set.id} badge references unknown ${bugId}`);
  }
});

test("new category filters cover every added entry without changing badge requirements", () => {
  const dutchHome = bugDexSets.find((set) => set.id === "dutch_home");
  const dutchGarden = bugDexSets.find((set) => set.id === "dutch_garden");
  assert.ok(dutchHome);
  assert.ok(dutchGarden);
  assert.equal(dutchHome.badgeId, undefined);
  assert.equal(dutchGarden.badgeId, undefined);

  const filteredIds = new Set([...dutchHome.bugIds, ...dutchGarden.bugIds]);
  for (const id of addedIds) assert.ok(filteredIds.has(id), `new entry ${id} is missing from Dutch filters`);

  for (const set of bugDexSets.filter((item) => item.badgeId)) {
    const badgeIds = bugDexSetBadgeBugIds(set);
    assert.ok(badgeIds.length > 0, `${set.id} has an empty badge requirement`);
    assert.ok(badgeIds.every((id) => !addedIds.has(id)), `${set.id} badge was made harder by a new entry`);
  }
});
