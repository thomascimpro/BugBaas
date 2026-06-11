#!/usr/bin/env node

import { createRequire } from "node:module";

const projectId = "thomascimpro-6266f";
const databaseId = "(default)";
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
const cimproNames = new Set(["jean", "biertje", "boompie", "debuglex"]);
const cimproProjects = new Set(["tconnect", "tbox"]);

const stringValue = (value) => ({ stringValue: value });
const arrayStringValue = (values) => ({ arrayValue: { values: values.map(stringValue) } });
const mapStringValue = (entries) => ({ mapValue: { fields: Object.fromEntries(Object.entries(entries).map(([key, value]) => [key, stringValue(value)])) } });
const docId = (name) => name.split("/").pop();

function fieldString(doc, field) {
  return doc.fields?.[field]?.stringValue ?? "";
}

function matchesCimproUser(doc) {
  const displayName = fieldString(doc, "displayName").trim().toLowerCase();
  const emailPrefix = fieldString(doc, "email").split("@")[0]?.trim().toLowerCase() ?? "";
  return cimproNames.has(displayName) || cimproNames.has(emailPrefix);
}

function matchesCimproProject(doc) {
  return cimproProjects.has(fieldString(doc, "project").trim().toLowerCase());
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

async function listCollection(path, token) {
  const docs = [];
  let pageToken = "";
  do {
    const separator = path.includes("?") ? "&" : "?";
    const page = await firestoreFetch(`${path}${separator}pageSize=300${pageToken ? `&pageToken=${pageToken}` : ""}`, token);
    docs.push(...(page.documents ?? []));
    pageToken = page.nextPageToken ?? "";
  } while (pageToken);
  return docs;
}

async function patchOrganization(collectionPath, id, token, organizationId, organizationName) {
  await firestoreFetch(
    `/${collectionPath}/${id}?updateMask.fieldPaths=organizationId&updateMask.fieldPaths=organizationName`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({
        fields: {
          organizationId: stringValue(organizationId),
          organizationName: stringValue(organizationName)
        }
      })
    }
  );
}

async function patchUserMembership(id, token, organizationId, organizationName) {
  await firestoreFetch(
    `/users/${id}?updateMask.fieldPaths=organizationId&updateMask.fieldPaths=organizationName&updateMask.fieldPaths=organizationIds&updateMask.fieldPaths=organizationNames`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({
        fields: {
          organizationId: stringValue(organizationId),
          organizationName: stringValue(organizationName),
          organizationIds: organizationId === "public" ? { arrayValue: {} } : arrayStringValue([organizationId]),
          organizationNames: organizationId === "public" ? { mapValue: { fields: {} } } : mapStringValue({ [organizationId]: organizationName })
        }
      })
    }
  );
}

async function writeDocument(collectionPath, id, token, fields) {
  await firestoreFetch(`/${collectionPath}/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify({ fields })
  });
}

async function deleteDocument(collectionPath, id, token) {
  await firestoreFetch(`/${collectionPath}/${id}`, token, { method: "DELETE" });
}

async function upsertOrganizationDocument(token, organizationId, organizationName, ownerDoc) {
  if (!ownerDoc) return false;
  await firestoreFetch(
    `/organizations/${organizationId}?updateMask.fieldPaths=id&updateMask.fieldPaths=name&updateMask.fieldPaths=createdBy&updateMask.fieldPaths=createdByName&updateMask.fieldPaths=createdAt`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({
        fields: {
          id: stringValue(organizationId),
          name: stringValue(organizationName),
          createdBy: stringValue(docId(ownerDoc.name)),
          createdByName: stringValue(fieldString(ownerDoc, "displayName") || "boompie"),
          createdAt: stringValue(new Date().toISOString())
        }
      })
    }
  );
  return true;
}

async function upsertOrganizationMember(token, organizationId, organizationName, userDoc, ownerDoc) {
  const uid = docId(userDoc.name);
  const ownerUid = ownerDoc ? docId(ownerDoc.name) : "";
  const role = uid === ownerUid ? "owner" : "member";
  await writeDocument(`organizations/${organizationId}/members`, uid, token, {
    uid: stringValue(uid),
    displayName: stringValue(fieldString(userDoc, "displayName") || uid),
    email: stringValue(fieldString(userDoc, "email")),
    role: stringValue(role),
    organizationId: stringValue(organizationId),
    organizationName: stringValue(organizationName),
    joinedAt: stringValue(new Date().toISOString())
  });
}

async function main() {
  const token = await accessToken();
  const users = await listCollection("/users", token);
  let cimproUsers = 0;
  let publicUsers = 0;
  let cimproOwner = null;
  const cimproUserDocs = [];

  for (const user of users) {
    const isCimpro = matchesCimproUser(user);
    const displayName = fieldString(user, "displayName").trim().toLowerCase();
    const emailPrefix = fieldString(user, "email").split("@")[0]?.trim().toLowerCase() ?? "";
    if (isCimpro && (displayName === "boompie" || emailPrefix === "boompie")) cimproOwner = user;
    const currentId = fieldString(user, "organizationId");
    const currentName = fieldString(user, "organizationName");
    if (isCimpro) {
      cimproUserDocs.push(user);
      await patchUserMembership(docId(user.name), token, "cimpro", "Cimpro");
    } else if (!currentId) {
      await patchOrganization("users", docId(user.name), token, "public", "Public");
    }
    if (isCimpro) cimproUsers += 1;
    else publicUsers += 1;
  }
  const cimproOrganizationUpserted = await upsertOrganizationDocument(token, "cimpro", "Cimpro", cimproOwner);
  for (const user of cimproUserDocs) {
    await upsertOrganizationMember(token, "cimpro", "Cimpro", user, cimproOwner);
  }

  const bugs = await listCollection("/bugs", token);
  let cimproBugs = 0;
  let publicBugs = 0;
  let commentsUpdated = 0;
  let organizationBugsMigrated = 0;

  for (const bug of bugs) {
    const bugId = docId(bug.name);
    const isCimpro = matchesCimproProject(bug);
    const nextId = isCimpro ? "cimpro" : "public";
    const nextName = isCimpro ? "Cimpro" : "Public";
    const currentId = fieldString(bug, "organizationId");
    const currentName = fieldString(bug, "organizationName");
    if (currentId !== nextId || currentName !== nextName) {
      await patchOrganization("bugs", bugId, token, nextId, nextName);
    }
    if (isCimpro) cimproBugs += 1;
    else publicBugs += 1;

    const comments = await listCollection(`/bugs/${bugId}/comments`, token);
    for (const comment of comments) {
      const commentId = docId(comment.name);
      if (fieldString(comment, "organizationId") !== nextId || fieldString(comment, "organizationName") !== nextName) {
        await patchOrganization(`bugs/${bugId}/comments`, commentId, token, nextId, nextName);
        commentsUpdated += 1;
      }
    }

    if (nextId !== "public") {
      const migratedFields = {
        ...bug.fields,
        organizationId: stringValue(nextId),
        organizationName: stringValue(nextName)
      };
      await writeDocument("organizationBugs", bugId, token, migratedFields);
      for (const comment of comments) {
        const commentId = docId(comment.name);
        const migratedCommentFields = {
          ...comment.fields,
          organizationId: stringValue(nextId),
          organizationName: stringValue(nextName)
        };
        await writeDocument(`organizationBugs/${bugId}/comments`, commentId, token, migratedCommentFields);
        await deleteDocument(`bugs/${bugId}/comments`, commentId, token);
      }
      await deleteDocument("bugs", bugId, token);
      organizationBugsMigrated += 1;
    }
  }

  console.log(`Seeded organizations: ${cimproUsers} Cimpro users, ${publicUsers} public users, ${cimproBugs} Cimpro reports, ${publicBugs} public reports, ${commentsUpdated} comments updated, ${organizationBugsMigrated} org reports migrated, Cimpro org doc ${cimproOrganizationUpserted ? "upserted" : "skipped"}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
