import assert from "node:assert/strict";
import test from "node:test";
import { createFirebaseUsageStore, RealBugScanQuotaError } from "./firebaseUsageStore.mjs";

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return payload; },
    async text() { return JSON.stringify(payload); }
  };
}

test("checks remaining daily scans without writing", async () => {
  const calls = [];
  const store = createFirebaseUsageStore({
    projectId: "project-1",
    fetchImpl: async (url, init = {}) => {
      calls.push({ url, init });
      return jsonResponse(200, {
        fields: {
          day: { stringValue: "2026-07-20" },
          scanIds: { arrayValue: { values: [{ stringValue: "scan-old" }] } },
          updatedAt: { stringValue: "now" },
          used: { integerValue: "1" }
        },
        updateTime: "2026-07-20T10:00:00Z"
      });
    }
  });

  const result = await store.check({ idToken: "token", uid: "user-1", dayKey: "2026-07-20", scanId: "scan-new" });

  assert.equal(result.remainingScans, 2);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, "GET");
});

test("creates the first daily server reservation", async () => {
  const calls = [];
  const store = createFirebaseUsageStore({
    projectId: "project-1",
    fetchImpl: async (url, init = {}) => {
      calls.push({ url, init });
      return calls.length === 1 ? jsonResponse(404, {}) : jsonResponse(200, { updateTime: "now" });
    }
  });

  const result = await store.reserve({ idToken: "token", uid: "user-1", dayKey: "2026-07-20", scanId: "scan-123" });

  assert.equal(result.remainingScans, 2);
  assert.equal(calls[1].init.method, "PATCH");
  assert.match(calls[1].url, /currentDocument\.exists=false/);
});

test("rejects a fourth daily server reservation before writing", async () => {
  const store = createFirebaseUsageStore({
    projectId: "project-1",
    fetchImpl: async () => jsonResponse(200, {
      fields: {
        day: { stringValue: "2026-07-20" },
        scanIds: { arrayValue: { values: [{ stringValue: "a" }, { stringValue: "b" }, { stringValue: "c" }] } },
        updatedAt: { stringValue: "now" },
        used: { integerValue: "3" }
      },
      updateTime: "2026-07-20T10:00:00Z"
    })
  });

  await assert.rejects(
    () => store.reserve({ idToken: "token", uid: "user-1", dayKey: "2026-07-20", scanId: "scan-4" }),
    (error) => error instanceof RealBugScanQuotaError && error.reason === "limit"
  );
});

test("rejects a duplicate scan id before writing", async () => {
  const store = createFirebaseUsageStore({
    projectId: "project-1",
    fetchImpl: async () => jsonResponse(200, {
      fields: {
        day: { stringValue: "2026-07-20" },
        scanIds: { arrayValue: { values: [{ stringValue: "scan-123" }] } },
        updatedAt: { stringValue: "now" },
        used: { integerValue: "1" }
      },
      updateTime: "2026-07-20T10:00:00Z"
    })
  });

  await assert.rejects(
    () => store.reserve({ idToken: "token", uid: "user-1", dayKey: "2026-07-20", scanId: "scan-123" }),
    (error) => error instanceof RealBugScanQuotaError && error.reason === "duplicate"
  );
});
