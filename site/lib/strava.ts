import { runtimeEnv } from "./runtime";

export type StravaConnection = {
  access_token: string;
  athlete_id: string;
  athlete_name: string | null;
  expires_at: number;
  last_sync_at: string | null;
  refresh_token: string;
  uid: string;
};

type StravaTokenResponse = {
  access_token: string;
  athlete?: { firstname?: string; id?: number; lastname?: string };
  expires_at: number;
  refresh_token: string;
};

export async function encryptToken(value: string): Promise<string> {
  const key = await encryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

export async function decryptToken(value: string): Promise<string> {
  const [ivValue, encryptedValue] = value.split(".");
  if (!ivValue || !encryptedValue) throw new Error("Stored Strava token is invalid.");
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivValue) },
    await encryptionKey(),
    base64ToBytes(encryptedValue),
  );
  return new TextDecoder().decode(decrypted);
}

export async function exchangeAuthorizationCode(code: string, redirectUri: string): Promise<StravaTokenResponse> {
  return tokenRequest({
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
}

export async function refreshConnection(connection: StravaConnection): Promise<StravaConnection> {
  if (connection.expires_at > Math.floor(Date.now() / 1000) + 120) return connection;
  const refreshed = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: await decryptToken(connection.refresh_token),
  });
  const next = {
    ...connection,
    access_token: await encryptToken(refreshed.access_token),
    expires_at: refreshed.expires_at,
    refresh_token: await encryptToken(refreshed.refresh_token),
  };
  await runtimeEnv().DB.prepare(
    "UPDATE strava_connections SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = ? WHERE uid = ?",
  ).bind(next.access_token, next.refresh_token, next.expires_at, new Date().toISOString(), next.uid).run();
  return next;
}

export function stravaAuthorizationUrl(request: Request, state: string): string {
  const clientId = runtimeEnv().STRAVA_CLIENT_ID;
  if (!clientId) throw new Error("Strava is not configured yet.");
  const redirectUri = new URL("/api/strava/callback", request.url).toString();
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", "activity:read_all");
  url.searchParams.set("state", state);
  return url.toString();
}

async function tokenRequest(values: Record<string, string>): Promise<StravaTokenResponse> {
  const current = runtimeEnv();
  if (!current.STRAVA_CLIENT_ID || !current.STRAVA_CLIENT_SECRET) throw new Error("Strava is not configured yet.");
  const body = new URLSearchParams({
    client_id: current.STRAVA_CLIENT_ID,
    client_secret: current.STRAVA_CLIENT_SECRET,
    ...values,
  });
  const response = await fetch("https://www.strava.com/oauth/token", {
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
  const payload = await response.json() as StravaTokenResponse & { message?: string };
  if (!response.ok) throw new Error(payload.message || "Could not retrieve the Strava token.");
  return payload;
}

async function encryptionKey(): Promise<CryptoKey> {
  const raw = runtimeEnv().STRAVA_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("Strava token encryption is not configured.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
