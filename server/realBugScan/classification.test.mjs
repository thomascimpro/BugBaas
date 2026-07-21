import assert from "node:assert/strict";
import test from "node:test";
import { normalizeIdentification } from "./classification.mjs";

const catalog = [{ id: "mier", name: "Mier", rarity: "Gewoon" }];

test("routes a confident missing species to developer review", () => {
  const result = normalizeIdentification({
    containsBug: true,
    imageQuality: "good",
    catalogStatus: "not_in_catalog",
    matchedBugId: null,
    commonName: "Gewone meikever",
    scientificName: "Melolontha melolontha",
    confidence: 0.92,
    reason: "Duidelijk herkenbare soort."
  }, catalog);

  assert.equal(result.status, "not_in_catalog");
  assert.equal(result.identification.bugId, null);
  assert.equal(result.identification.commonName, "Gewone meikever");
});

test("keeps uncertain generic insects out of the developer queue", () => {
  const result = normalizeIdentification({
    containsBug: true,
    imageQuality: "good",
    catalogStatus: "not_in_catalog",
    matchedBugId: null,
    commonName: "Insect",
    scientificName: "",
    confidence: 0.91,
    reason: "Niet specifiek genoeg."
  }, catalog);

  assert.equal(result.status, "pending_review");
});
