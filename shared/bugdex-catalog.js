const fs = require("node:fs");
const path = require("node:path");

const pointsServicePath = path.join(__dirname, "..", "src", "services", "pointsService.ts");
const source = fs.readFileSync(pointsServicePath, "utf8");
const entryPattern = /\{ id: "([^"]+)", name: "([^"]+)", title: "[^"]+", minPoints: \d+, minBugs: \d+, rarity: "([^"]+)"/g;
const catalog = Array.from(source.matchAll(entryPattern), ([, id, name, rarity]) => ({ id, name, rarity }));

if (catalog.length < 10) throw new Error("BugDex catalog could not be generated from pointsService.ts.");

module.exports = catalog;
