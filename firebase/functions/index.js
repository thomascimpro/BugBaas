const { createCipheriv, createDecipheriv, createHash, randomBytes } = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { FieldValue, Timestamp, getFirestore } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const { activityDistanceKm, activityImportId, activityTimestamp, tokenExpiryMs } = require("./fitnessSyncerCore");

initializeApp();

const db = getFirestore();
const oauthStateCollection = "fitnessSyncerOauthStates";
const scopes = "source_read source_data_activity_read";
const allowedOrigins = new Set([
  "https://bugbaas.vercel.app",
  "http://localhost:8081",
  "http://localhost:19006"
]);

exports.fitnessSyncerStatus = onRequest({ cors: false, region: "us-central1" }, async (req, res) => {
  if (!setCors(req, res) || req.method === "OPTIONS") return;
  try {
    const uid = await authenticatedUid(req);
    const snapshot = await integrationRef(uid).get();
    const data = snapshot.data() || {};
    res.json({
      configured: configurationReady(),
      connected: snapshot.exists,
      lastError: data.lastError || undefined,
      lastSyncAt: data.lastSyncAt?.toDate?.().toISOString?.() || undefined
    });
  } catch (error) {
    sendError(res, error);
  }
});

exports.fitnessSyncerStart = onRequest({ cors: false, region: "us-central1" }, async (req, res) => {
  if (!setCors(req, res) || req.method === "OPTIONS") return;
  try {
    requirePost(req);
    requireConfiguration();
    const uid = await authenticatedUid(req);
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(48).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    await db.collection(oauthStateCollection).doc(hash(state)).set({
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
      uid,
      verifier
    });
    const url = new URL("https://www.fitnesssyncer.com/api/oauth/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", process.env.FITNESSSYNCER_CLIENT_ID);
    url.searchParams.set("redirect_uri", redirectUri());
    url.searchParams.set("scope", scopes);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    res.json({ authorizationUrl: url.toString() });
  } catch (error) {
    sendError(res, error);
  }
});

exports.fitnessSyncerCallback = onRequest({ cors: false, region: "us-central1" }, async (req, res) => {
  try {
    requireConfiguration();
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    if (!code || !state || code === "error") throw httpError(400, "FitnessSyncer authorization was not completed.");
    const stateRef = db.collection(oauthStateCollection).doc(hash(state));
    const stateSnapshot = await stateRef.get();
    const stateData = stateSnapshot.data();
    if (!stateSnapshot.exists || !stateData || stateData.expiresAt.toMillis() < Date.now()) {
      throw httpError(400, "FitnessSyncer authorization state expired.");
    }
    await stateRef.delete();
    const token = await exchangeToken({
      code,
      code_verifier: stateData.verifier,
      grant_type: "authorization_code"
    });
    await integrationRef(stateData.uid).set({
      connectedAt: FieldValue.serverTimestamp(),
      expiresAt: tokenExpiryMs(token.expires_in),
      scope: token.scope || scopes,
      token: encryptJson({ accessToken: token.access_token, refreshToken: token.refresh_token }),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    res.redirect(302, `${appReturnUrl()}?fitnessSyncer=connected`);
  } catch (error) {
    logger.error("FitnessSyncer callback failed", safeError(error));
    res.redirect(302, `${appReturnUrl()}?fitnessSyncer=error`);
  }
});

exports.fitnessSyncerSync = onRequest({ cors: false, region: "us-central1", timeoutSeconds: 60 }, async (req, res) => {
  if (!setCors(req, res) || req.method === "OPTIONS") return;
  try {
    requirePost(req);
    requireConfiguration();
    const uid = await authenticatedUid(req);
    const integration = await integrationRef(uid).get();
    if (!integration.exists) throw httpError(409, "FitnessSyncer is not connected.");
    const data = integration.data();
    let tokens = decryptJson(data.token);
    let expiresAt = Number(data.expiresAt || 0);
    if (expiresAt <= Date.now() + 60000) {
      const refreshed = await exchangeToken({ grant_type: "refresh_token", refresh_token: tokens.refreshToken });
      tokens = { accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token || tokens.refreshToken };
      expiresAt = tokenExpiryMs(refreshed.expires_in);
      await integration.ref.set({ expiresAt, token: encryptJson(tokens), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    const result = await readActivityDistances(tokens.accessToken, uid);
    await integration.ref.set({ lastError: FieldValue.delete(), lastSyncAt: FieldValue.serverTimestamp() }, { merge: true });
    res.json(result);
  } catch (error) {
    logger.error("FitnessSyncer sync failed", safeError(error));
    sendError(res, error);
  }
});

exports.fitnessSyncerDisconnect = onRequest({ cors: false, region: "us-central1" }, async (req, res) => {
  if (!setCors(req, res) || req.method === "OPTIONS") return;
  try {
    requirePost(req);
    const uid = await authenticatedUid(req);
    const ref = integrationRef(uid);
    const snapshot = await ref.get();
    if (snapshot.exists && configurationReady()) {
      const tokens = decryptJson(snapshot.data().token);
      await fetch("https://api.fitnesssyncer.com/api/oauth/revoke_token", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        method: "POST"
      }).catch(() => undefined);
    }
    await ref.delete();
    res.json({ disconnected: true });
  } catch (error) {
    sendError(res, error);
  }
});

async function readActivityDistances(accessToken, uid) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = startOfIsoWeek(now).getTime();
  const queryStart = Math.min(todayStart, weekStart) - 24 * 60 * 60 * 1000;
  const sourcesResponse = await fitnessSyncerGet("/providers/sources/", accessToken);
  const sources = arrayItems(sourcesResponse).map(unwrap).filter((source) => String(source.type || source.taskType || "").toLowerCase() === "activity");
  let todayKm = 0;
  let weekKm = 0;
  let importedActivities = 0;
  const importWrites = [];

  for (const source of sources) {
    const sourceId = String(source.id || source.taskId || "");
    if (!sourceId) continue;
    for (let offset = 0; offset < 1000; offset += 100) {
      const response = await fitnessSyncerGet(`/providers/sources/${encodeURIComponent(sourceId)}/items/?startDate=${queryStart}&endDate=${Date.now()}&offset=${offset}&limit=100`, accessToken);
      const items = arrayItems(response);
      for (const value of items) {
        const distanceKm = activityDistanceKm(value);
        const timestamp = activityTimestamp(value);
        if (!distanceKm || !timestamp) continue;
        if (timestamp >= weekStart) weekKm += distanceKm;
        if (timestamp >= todayStart) todayKm += distanceKm;
        importedActivities += 1;
        importWrites.push({ distanceKm, id: activityImportId(sourceId, value), sourceId, timestamp });
      }
      if (items.length < 100) break;
    }
  }
  await recordImports(uid, importWrites);
  return {
    importedActivities,
    todayKm: Math.round(todayKm * 100) / 100,
    weekKm: Math.round(weekKm * 100) / 100
  };
}

async function recordImports(uid, imports) {
  const root = integrationRef(uid).collection("imports");
  for (let offset = 0; offset < imports.length; offset += 400) {
    const batch = db.batch();
    imports.slice(offset, offset + 400).forEach((item) => {
      batch.set(root.doc(item.id), {
        distanceKm: item.distanceKm,
        importedAt: FieldValue.serverTimestamp(),
        providerActivityAt: Timestamp.fromMillis(item.timestamp),
        sourceId: item.sourceId
      }, { merge: true });
    });
    await batch.commit();
  }
}

async function exchangeToken(values) {
  const body = new URLSearchParams({
    client_id: process.env.FITNESSSYNCER_CLIENT_ID,
    client_secret: process.env.FITNESSSYNCER_CLIENT_SECRET,
    redirect_uri: redirectUri(),
    ...values
  });
  const response = await fetch("https://api.fitnesssyncer.com/api/oauth/access_token", {
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw httpError(502, payload.error_description || "FitnessSyncer token exchange failed.");
  return payload;
}

async function fitnessSyncerGet(path, accessToken) {
  const response = await fetch(`https://api.fitnesssyncer.com/api${path}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` }
  });
  if (response.status === 401 || response.status === 403) throw httpError(401, "Reconnect FitnessSyncer to continue.");
  if (!response.ok) throw httpError(502, `FitnessSyncer returned ${response.status}.`);
  return response.json();
}

async function authenticatedUid(req) {
  const match = String(req.headers.authorization || "").match(/^Bearer (.+)$/);
  if (!match) throw httpError(401, "Authentication required.");
  return (await getAuth().verifyIdToken(match[1])).uid;
}

function integrationRef(uid) {
  return db.doc(`users/${uid}/privateIntegrations/fitnesssyncer`);
}

function configurationReady() {
  return Boolean(process.env.FITNESSSYNCER_CLIENT_ID && process.env.FITNESSSYNCER_CLIENT_SECRET && process.env.FITNESSSYNCER_TOKEN_KEY);
}

function requireConfiguration() {
  if (!configurationReady()) throw httpError(503, "FitnessSyncer configuration is not active yet.");
}

function redirectUri() {
  return process.env.FITNESSSYNCER_REDIRECT_URI || "https://us-central1-thomascimpro-6266f.cloudfunctions.net/fitnessSyncerCallback";
}

function appReturnUrl() {
  return process.env.FITNESSSYNCER_APP_RETURN_URL || "https://bugbaas.vercel.app/";
}

function encryptJson(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return { ciphertext: encrypted.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), version: 1 };
}

function decryptJson(value) {
  if (!value?.ciphertext || !value?.iv || !value?.tag) throw httpError(409, "Reconnect FitnessSyncer to continue.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(value.iv, "base64"));
  decipher.setAuthTag(Buffer.from(value.tag, "base64"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.ciphertext, "base64")), decipher.final()]).toString("utf8"));
}

function encryptionKey() {
  return createHash("sha256").update(String(process.env.FITNESSSYNCER_TOKEN_KEY || "")).digest();
}

function setCors(req, res) {
  const origin = String(req.headers.origin || "");
  if (origin && !allowedOrigins.has(origin)) {
    res.status(403).json({ error: "Origin not allowed." });
    return false;
  }
  if (origin) res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Vary", "Origin");
  if (req.method === "OPTIONS") res.status(204).send("");
  return true;
}

function requirePost(req) {
  if (req.method !== "POST") throw httpError(405, "Method not allowed.");
}

function arrayItems(value) {
  return Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
}

function unwrap(value) {
  return value && typeof value === "object" && value.item && typeof value.item === "object" ? value.item : value;
}

function startOfIsoWeek(value) {
  const date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function sendError(res, error) {
  const status = Number(error?.status) || 500;
  if (status >= 500) logger.error("FitnessSyncer request failed", safeError(error));
  res.status(status).json({ error: status >= 500 && status !== 503 ? "FitnessSyncer is temporarily unavailable." : String(error?.message || "Request failed.") });
}

function safeError(error) {
  return { message: String(error?.message || error), status: Number(error?.status) || 500 };
}
