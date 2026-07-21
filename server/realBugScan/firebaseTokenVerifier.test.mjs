import assert from "node:assert/strict";
import test from "node:test";
import { createFirebaseTokenVerifier } from "./firebaseTokenVerifier.mjs";

test("returns the Firebase uid for a valid ID token", async () => {
  let requestBody;
  const verifyIdToken = createFirebaseTokenVerifier({
    apiKey: "firebase-web-key",
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ users: [{ localId: "user-123", email: "test@example.com" }] })
      };
    }
  });

  const result = await verifyIdToken("firebase-id-token");

  assert.equal(result.uid, "user-123");
  assert.equal(requestBody.idToken, "firebase-id-token");
});

test("rejects an invalid Firebase token", async () => {
  const verifyIdToken = createFirebaseTokenVerifier({
    apiKey: "firebase-web-key",
    fetchImpl: async () => ({
      ok: false,
      status: 400,
      text: async () => "INVALID_ID_TOKEN"
    })
  });

  await assert.rejects(() => verifyIdToken("bad-token"), /Firebase token verification failed/);
});

test("requires the Firebase web API key", async () => {
  const verifyIdToken = createFirebaseTokenVerifier({ apiKey: "" });
  await assert.rejects(() => verifyIdToken("token"), /FIREBASE_API_KEY/);
});
