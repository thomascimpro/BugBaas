#!/usr/bin/env node

import { createRequire } from "node:module";

const projectId = "<firebase-project-id>";
const databaseId = "(default)";
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
const starterBoostMaxStartingXp = 80;
const starterBoostDurationMs = 3 * 24 * 60 * 60 * 1000;
const apply = process.argv.includes("--apply");

const stringValue = (value) => ({ stringValue: value });
const docId = (name) => name.split("/").pop();

function fieldNumber(doc, field) {
  const value = doc.fields?.[field];
  if (!value) return 0;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return Number(value.doubleValue);
  return 0;
}

function fieldString(doc, field) {
  return doc.fields?.[field]?.stringValue ?? "";
}

function fieldBoolean(doc, field) {
  return doc.fields?.[field]?.booleanValue;
}

async function accessToken() {
  if (process.env.FIRESTORE_ACCESS_TOKEN) return process.env.FIRESTORE_ACCESS_TOKEN;
  try {
    const require = createRequire(import.meta.url);
    const auth = require("C:/Users/thoma.THOMAS/AppData/Roaming/npm/node_modules/firebase-tools/lib/auth");
    const scopes = require("C:/Users/thoma.THOMAS/AppData/Roaming/npm/node_modules/firebase-tools/lib/scopes");
    const account = await auth.getGlobalDefaultAccount();
    const token = await auth.getAccessToken(account?.tokens?.refresh_token, [scopes.CLOUD_PLATFORM, scopes.FIREBASE_PLATFORM, scopes.EMAIL]);
    return typeof token === "string" ? token : token.access_token;
  } catch (error) {
    throw new Error(`No Firestore access token available: ${error.message}`);
  }
}

async function firestoreFetch(path, token, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status} ${text}`);
  }
  return response.status === 204 ? null : response.json();
}

async function listUsers(token) {
  const docs = [];
  let pageToken = "";
  do {
    const page = await firestoreFetch(`/users?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ""}`, token);
    docs.push(...(page.documents ?? []));
    pageToken = page.nextPageToken ?? "";
  } while (pageToken);
  return docs;
}

async function patchStarterBoost(id, token, grantedAt, activeUntil) {
  await firestoreFetch(
    `/users/${id}?updateMask.fieldPaths=starterBoostActiveUntil&updateMask.fieldPaths=starterBoostGrantedAt`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({
        fields: {
          starterBoostActiveUntil: stringValue(activeUntil),
          starterBoostGrantedAt: stringValue(grantedAt)
        }
      })
    }
  );
}

async function main() {
  const token = await accessToken();
  const now = Date.now();
  const grantedAt = new Date(now).toISOString();
  const targetUntil = new Date(now + starterBoostDurationMs).toISOString();
  const users = await listUsers(token);
  const eligible = users
    .map((doc) => {
      const totalPoints = fieldNumber(doc, "totalPoints");
      const active = fieldBoolean(doc, "active");
      const currentUntil = fieldString(doc, "starterBoostActiveUntil");
      const currentUntilMs = Date.parse(currentUntil);
      const activeUntil = Number.isFinite(currentUntilMs) && currentUntilMs > now + starterBoostDurationMs
        ? currentUntil
        : targetUntil;
      return {
        id: docId(doc.name),
        displayName: fieldString(doc, "displayName"),
        totalPoints,
        active,
        currentUntil,
        activeUntil
      };
    })
    .filter((user) => user.active !== false && user.totalPoints < starterBoostMaxStartingXp);

  console.log(`${apply ? "Applying" : "Dry run"} starter boost for ${eligible.length}/${users.length} active users under ${starterBoostMaxStartingXp} XP.`);
  for (const user of eligible) {
    console.log(`- ${user.displayName || user.id}: ${user.totalPoints} XP -> ${user.activeUntil}`);
    if (apply) await patchStarterBoost(user.id, token, grantedAt, user.activeUntil);
  }
  if (!apply) console.log("Run with --apply to write these changes.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
