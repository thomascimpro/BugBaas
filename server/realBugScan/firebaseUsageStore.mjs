const defaultMaxDailyScans = 3;
const maxWriteAttempts = 4;

export class RealBugScanQuotaError extends Error {
  constructor(reason) {
    super(reason === "duplicate" ? "Deze scan is al verwerkt." : "Daglimiet voor echte bugscans bereikt.");
    this.name = "RealBugScanQuotaError";
    this.reason = reason;
  }
}

function usageDocumentUrl(projectId, uid, dayKey) {
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
  return `${base}/users/${encodeURIComponent(uid)}/realBugScanServerUsage/${encodeURIComponent(dayKey)}`;
}

function integerValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function parseUsageDocument(payload) {
  const fields = payload?.fields ?? {};
  const values = fields.scanIds?.arrayValue?.values ?? [];
  return {
    scanIds: values.map((value) => String(value?.stringValue ?? "")).filter(Boolean),
    updateTime: String(payload?.updateTime ?? ""),
    used: integerValue(fields.used?.integerValue)
  };
}

function usageDocumentBody(dayKey, used, scanIds) {
  return JSON.stringify({
    fields: {
      day: { stringValue: dayKey },
      scanIds: { arrayValue: { values: scanIds.map((scanId) => ({ stringValue: scanId })) } },
      updatedAt: { stringValue: new Date().toISOString() },
      used: { integerValue: String(used) }
    }
  });
}

function authorizationHeaders(idToken) {
  return {
    Authorization: `Bearer ${idToken}`,
    "Content-Type": "application/json"
  };
}

async function readError(response) {
  if (typeof response.text !== "function") return "";
  return response.text().catch(() => "");
}

export function createFirebaseUsageStore({ projectId, fetchImpl = fetch, maxDailyScans = defaultMaxDailyScans } = {}) {
  return {
    async check({ idToken, uid, dayKey, scanId }) {
      if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not configured.");
      const response = await fetchImpl(usageDocumentUrl(projectId, uid, dayKey), {
        headers: authorizationHeaders(idToken),
        method: "GET"
      });

      if (response.status === 404) return { remainingScans: maxDailyScans };
      if (!response.ok) {
        await readError(response);
        throw new Error(`Firestore quota read failed: ${response.status}`);
      }

      const current = parseUsageDocument(await response.json());
      if (current.scanIds.includes(scanId)) throw new RealBugScanQuotaError("duplicate");
      if (current.used >= maxDailyScans) throw new RealBugScanQuotaError("limit");
      return { remainingScans: Math.max(0, maxDailyScans - current.used) };
    },

    async reserve({ idToken, uid, dayKey, scanId }) {
      if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not configured.");
      const url = usageDocumentUrl(projectId, uid, dayKey);

      for (let attempt = 0; attempt < maxWriteAttempts; attempt += 1) {
        const readResponse = await fetchImpl(url, {
          headers: authorizationHeaders(idToken),
          method: "GET"
        });

        let current = { scanIds: [], updateTime: "", used: 0 };
        let documentExists = false;
        if (readResponse.status === 404) {
          documentExists = false;
        } else if (readResponse.ok) {
          documentExists = true;
          current = parseUsageDocument(await readResponse.json());
        } else {
          await readError(readResponse);
          throw new Error(`Firestore quota read failed: ${readResponse.status}`);
        }

        if (current.scanIds.includes(scanId)) throw new RealBugScanQuotaError("duplicate");
        if (current.used >= maxDailyScans) throw new RealBugScanQuotaError("limit");

        const used = current.used + 1;
        const scanIds = [...current.scanIds, scanId];
        const precondition = documentExists
          ? `currentDocument.updateTime=${encodeURIComponent(current.updateTime)}`
          : "currentDocument.exists=false";
        const writeResponse = await fetchImpl(`${url}?${precondition}`, {
          body: usageDocumentBody(dayKey, used, scanIds),
          headers: authorizationHeaders(idToken),
          method: "PATCH"
        });

        if (writeResponse.ok) {
          return { remainingScans: Math.max(0, maxDailyScans - used) };
        }
        if (writeResponse.status === 409 || writeResponse.status === 412) continue;

        await readError(writeResponse);
        throw new Error(`Firestore quota write failed: ${writeResponse.status}`);
      }

      throw new Error("Bugscan quota kon niet veilig worden gereserveerd.");
    }
  };
}
