import assert from "node:assert/strict";
import test from "node:test";
import { createRealBugIdentifyHandler } from "./handler.mjs";

function responseStub() {
  return {
    headers: {},
    statusCode: 0,
    setHeader(name, value) { this.headers[name] = value; },
    end(body) { this.body = body ? JSON.parse(body) : undefined; }
  };
}

test("returns a successful missing catalog identification", async () => {
  const handler = createRealBugIdentifyHandler({
    catalog: [{ id: "mier", name: "Mier", rarity: "Gewoon" }],
    verifyIdToken: async () => ({ uid: "user-1" }),
    reserveUsage: async () => ({ remainingScans: 2 }),
    identifyImage: async () => ({
      containsBug: true,
      imageQuality: "good",
      catalogStatus: "not_in_catalog",
      matchedBugId: null,
      commonName: "Gewone meikever",
      scientificName: "Melolontha melolontha",
      confidence: 0.93,
      reason: "Duidelijke kenmerken."
    })
  });
  const response = responseStub();

  await handler({
    method: "POST",
    headers: { authorization: "Bearer token" },
    body: { scanId: "realbug_12345678", imageDataUrl: "data:image/jpeg;base64,YWJjZA==" }
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "not_in_catalog");
  assert.equal(response.body.identification.commonName, "Gewone meikever");
});

test("rejects requests without authentication", async () => {
  const handler = createRealBugIdentifyHandler({ catalog: [], verifyIdToken: async () => null, reserveUsage: async () => null, identifyImage: async () => null });
  const response = responseStub();
  await handler({ method: "POST", headers: {}, body: {} }, response);
  assert.equal(response.statusCode, 401);
});
