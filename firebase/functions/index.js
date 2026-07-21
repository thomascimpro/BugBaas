const { createCipheriv, createDecipheriv, createHash, randomBytes } = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { FieldValue, Timestamp, getFirestore } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const { onRequest } = require("firebase-functions/v2/https");
const { activityImportId, activityMovement, aggregateActivityMovement, fitnessServerConfigurationStatus, fitnessUserConfigurationStatus, tokenExpiryMs } = require("./fitnessSyncerCore");

initializeApp();

const db = getFirestore();
const fitnessSyncerTokenKey = defineSecret("FITNESSSYNCER_TOKEN_KEY");
const oauthStateCollection = "fitnessSyncerOauthStates";
const scopes = "source_read source_data_activity_read";
const allowedOrigins = new Set([
  "https://bugbaas.vercel.app",
  "http://localhost:8081",
  "http://localhost:19006"
]);

exports.fitnessSyncerStatus = onRequest({ cors: false, invoker: "public", region: "us-central1", secrets: [fitnessSyncerTokenKey] }, async (req, res) => {
  if (!setCors(req, res) || req.method === "OPTIONS") return;
  try {
    const uid = await authenticatedUid(req);
    const snapshot = await integrationRef(uid).get();
    const data = snapshot.data() || {};
    const serverConfiguration = fitnessServerConfigurationStatus(process.env);
    const credentialsConfigured = hasEncryptedValue(data.oauthApp);
    res.json({
      configured: serverConfiguration.configured && credentialsConfigured,
      connected: hasEncryptedValue(data.token),
      credentialsConfigured,
      serverReady: serverConfiguration.configured,
      missingConfiguration: [
        ...serverConfiguration.missingConfiguration,
        ...(credentialsConfigured ? [] : ["client_id", "client_secret"])
      ],
      lastError: data.lastError || undefined,
      lastSyncAt: data.lastSyncAt?.toDate?.().toISOString?.() || undefined
    });
  } catch (error) {
    sendError(res, error);
  }
});

exports.fitnessSyncerConfigure = onRequest({ cors: false, invoker: "public", region: "us-central1", secrets: [fitnessSyncerTokenKey] }, async (req, res) => {
  if (!setCors(req, res) || req.method === "OPTIONS") return;
  try {
    requirePost(req);
    const uid = await authenticatedUid(req);
    requireServerConfiguration();
    const credentials = normalizeOAuthAppCredentials(req.body);
    const configuration = fitnessUserConfigurationStatus(credentials);
    if (!configuration.configured) throw httpError(400, "Enter both FitnessSyncer Client ID and Client Secret.");
    if (credentials.clientId.length > 512 || credentials.clientSecret.length > 512) throw httpError(400, "FitnessSyncer credentials are too long.");
    const ref = integrationRef(uid);
    const snapshot = await ref.get();
    const current = snapshot.data() || {};
    if (hasEncryptedValue(current.oauthApp) && hasEncryptedValue(current.token)) {
      try {
        await revokeFitnessSyncerToken(decryptJson(current.token).accessToken, oauthAppCredentials(current));
      } catch {
        // Replacing credentials must remain possible when the old token is already invalid.
      }
    }
    await ref.set({
      connectedAt: FieldValue.delete(),
      expiresAt: FieldValue.delete(),
      lastError: FieldValue.delete(),
      lastSyncAt: FieldValue.delete(),
      oauthApp: encryptJson(credentials),
      scope: FieldValue.delete(),
      token: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    res.json({ configured: true, connected: false, credentialsConfigured: true, serverReady: true, missingConfiguration: [] });
  } catch (error) {
    sendError(res, error);
  }
});

exports.fitnessSyncerClearConfiguration = onRequest({ cors: false, invoker: "public", region: "us-central1", secrets: [fitnessSyncerTokenKey] }, async (req, res) => {
  if (!setCors(req, res) || req.method === "OPTIONS") return;
  try {
    requirePost(req);
    const uid = await authenticatedUid(req);
    const ref = integrationRef(uid);
    const snapshot = await ref.get();
    const serverReady = fitnessServerConfigurationStatus(process.env).configured;
    if (!snapshot.exists) {
      res.json({
        configured: false,
        connected: false,
        credentialsConfigured: false,
        serverReady,
        missingConfiguration: [...(serverReady ? [] : ["token_key"]), "client_id", "client_secret"]
      });
      return;
    }
    const data = snapshot.data() || {};
    if (serverReady && hasEncryptedValue(data.oauthApp) && hasEncryptedValue(data.token)) {
      const credentials = oauthAppCredentials(data);
      const tokens = decryptJson(data.token);
      await revokeFitnessSyncerToken(tokens.accessToken, credentials).catch(() => undefined);
    }
    await ref.set({
      connectedAt: FieldValue.delete(),
      expiresAt: FieldValue.delete(),
      lastError: FieldValue.delete(),
      lastSyncAt: FieldValue.delete(),
      oauthApp: FieldValue.delete(),
      scope: FieldValue.delete(),
      token: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    res.json({
      configured: false,
      connected: false,
      credentialsConfigured: false,
      serverReady,
      missingConfiguration: [...(serverReady ? [] : ["token_key"]), "client_id", "client_secret"]
    });
  } catch (error) {
    sendError(res, error);
  }
});

exports.fitnessSyncerStart = onRequest({ cors: false, invoker: "public", region: "us-central1", secrets: [fitnessSyncerTokenKey] }, async (req, res) => {
  if (!setCors(req, res) || req.method === "OPTIONS") return;
  try {
    requirePost(req);
    const uid = await authenticatedUid(req);
    requireServerConfiguration();
    const credentials = await loadOAuthAppCredentials(uid);
    const returnUrl = normalizeAppReturnUrl(req.body?.returnUrl);
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(48).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    await db.collection(oauthStateCollection).doc(hash(state)).set({
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
      returnUrl,
      uid,
      verifier
    });
    const url = new URL("https://www.fitnesssyncer.com/api/oauth/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", credentials.clientId);
    url.searchParams.set("redirect_uri", redirectUri());
    url.searchParams.set("scope", scopes);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    res.json({ authorizationUrl: url.toString() });
  } catch (error) {
    sendError(res, error);
  }
});

exports.fitnessSyncerCallback = onRequest({ cors: false, invoker: "public", region: "us-central1", secrets: [fitnessSyncerTokenKey] }, async (req, res) => {
  try {
    requireServerConfiguration();
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
    const credentials = await loadOAuthAppCredentials(stateData.uid);
    const token = await exchangeToken(credentials, {
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
    res.redirect(302, fitnessSyncerResultUrl(stateData.returnUrl, "connected"));
  } catch (error) {
    logger.error("FitnessSyncer callback failed", safeError(error));
    res.redirect(302, fitnessSyncerResultUrl(appReturnUrl(), "error"));
  }
});

exports.fitnessSyncerSync = onRequest({ cors: false, invoker: "public", region: "us-central1", secrets: [fitnessSyncerTokenKey], timeoutSeconds: 60 }, async (req, res) => {
  if (!setCors(req, res) || req.method === "OPTIONS") return;
  try {
    requirePost(req);
    const uid = await authenticatedUid(req);
    requireServerConfiguration();
    const integration = await integrationRef(uid).get();
    const data = integration.data() || {};
    if (!integration.exists || !hasEncryptedValue(data.token)) throw httpError(409, "FitnessSyncer is not connected.");
    const credentials = oauthAppCredentials(data);
    let tokens = decryptJson(data.token);
    let expiresAt = Number(data.expiresAt || 0);
    if (expiresAt <= Date.now() + 60000) {
      const refreshed = await exchangeToken(credentials, { grant_type: "refresh_token", refresh_token: tokens.refreshToken });
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

exports.fitnessSyncerDisconnect = onRequest({ cors: false, invoker: "public", region: "us-central1", secrets: [fitnessSyncerTokenKey] }, async (req, res) => {
  if (!setCors(req, res) || req.method === "OPTIONS") return;
  try {
    requirePost(req);
    const uid = await authenticatedUid(req);
    const ref = integrationRef(uid);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      res.json({ disconnected: true });
      return;
    }
    const data = snapshot.data() || {};
    if (fitnessServerConfigurationStatus(process.env).configured && hasEncryptedValue(data.oauthApp) && hasEncryptedValue(data.token)) {
      const credentials = oauthAppCredentials(data);
      const tokens = decryptJson(data.token);
      await revokeFitnessSyncerToken(tokens.accessToken, credentials).catch(() => undefined);
    }
    await ref.set({
      connectedAt: FieldValue.delete(),
      expiresAt: FieldValue.delete(),
      lastError: FieldValue.delete(),
      lastSyncAt: FieldValue.delete(),
      scope: FieldValue.delete(),
      token: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
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
  const activityRecords = [];
  const importWrites = [];

  for (const source of sources) {
    const sourceId = String(source.id || source.taskId || "");
    if (!sourceId) continue;
    for (let offset = 0; offset < 1000; offset += 100) {
      const response = await fitnessSyncerGet(`/providers/sources/${encodeURIComponent(sourceId)}/items/?startDate=${queryStart}&endDate=${Date.now()}&offset=${offset}&limit=100`, accessToken);
      const items = arrayItems(response);
      for (const listEntry of items) {
        const itemId = String(unwrap(listEntry)?.itemId || "");
        if (!itemId) continue;
        const detailResponse = await fitnessSyncerGet(`/providers/sources/${encodeURIComponent(sourceId)}/items/${encodeURIComponent(itemId)}`, accessToken);
        const value = { ...unwrap(detailResponse), itemId };
        const movement = activityMovement(value);
        if (!movement?.timestamp) continue;
        activityRecords.push({ sourceId, value });
        importWrites.push({
          distanceKm: Math.round(Math.max(movement.distanceKm, movement.steps * 0.00075) * 1000) / 1000,
          id: activityImportId(sourceId, value),
          sourceId,
          steps: movement.steps,
          timestamp: movement.timestamp
        });
      }
      if (items.length < 100) break;
    }
  }
  await recordImports(uid, importWrites);
  return {
    importedActivities: activityRecords.length,
    ...aggregateActivityMovement(activityRecords, todayStart, weekStart)
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
        sourceId: item.sourceId,
        steps: item.steps
      }, { merge: true });
    });
    await batch.commit();
  }
}

async function exchangeToken(credentials, values) {
  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
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

async function revokeFitnessSyncerToken(accessToken, credentials) {
  return fetch("https://api.fitnesssyncer.com/api/oauth/revoke_token", {
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      token: accessToken,
      token_type_hint: "access_token"
    }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST"
  });
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

async function loadOAuthAppCredentials(uid) {
  const snapshot = await integrationRef(uid).get();
  return oauthAppCredentials(snapshot.data() || {});
}

function oauthAppCredentials(data) {
  if (!hasEncryptedValue(data.oauthApp)) throw httpError(409, "Enter your FitnessSyncer Client ID and Client Secret first.");
  const credentials = normalizeOAuthAppCredentials(decryptJson(data.oauthApp));
  if (!fitnessUserConfigurationStatus(credentials).configured) throw httpError(409, "Enter your FitnessSyncer Client ID and Client Secret first.");
  return credentials;
}

function normalizeOAuthAppCredentials(value = {}) {
  return {
    clientId: String(value.clientId || "").trim(),
    clientSecret: String(value.clientSecret || "").trim()
  };
}

function hasEncryptedValue(value) {
  return Boolean(value?.ciphertext && value?.iv && value?.tag);
}

function requireServerConfiguration() {
  if (!fitnessServerConfigurationStatus(process.env).configured) throw httpError(503, "FitnessSyncer server encryption is not active yet.");
}

function redirectUri() {
  return process.env.FITNESSSYNCER_REDIRECT_URI || "https://us-central1-thomascimpro-6266f.cloudfunctions.net/fitnessSyncerCallback";
}

function appReturnUrl() {
  return process.env.FITNESSSYNCER_APP_RETURN_URL || "https://bugbaas.vercel.app/";
}

function normalizeAppReturnUrl(value) {
  const fallback = appReturnUrl();
  if (!value) return fallback;
  try {
    const url = new URL(String(value));
    const isBugBaasWeb = url.protocol === "https:" && url.hostname === "bugbaas.vercel.app";
    const isBugBaasApp = url.protocol === "bugbaas:";
    const isLocalWeb = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    return isBugBaasWeb || isBugBaasApp || isLocalWeb ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function fitnessSyncerResultUrl(returnUrl, result) {
  const url = new URL(normalizeAppReturnUrl(returnUrl));
  url.searchParams.set("fitnessSyncer", result);
  return url.toString();
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
