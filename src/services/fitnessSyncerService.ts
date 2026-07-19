import Constants from "expo-constants";
import { auth } from "../firebase";

export type FitnessSyncerStatus = {
  configured: boolean;
  connected: boolean;
  lastError?: string;
  lastSyncAt?: string;
};

export type FitnessSyncerSyncResult = {
  importedActivities: number;
  todayKm: number;
  weekKm: number;
};

const defaultApiBaseUrl = "https://us-central1-thomascimpro-6266f.cloudfunctions.net";
const configuredApiBaseUrl = String(Constants.expoConfig?.extra?.fitnessSyncerApiBaseUrl || defaultApiBaseUrl);
const apiBaseUrl = configuredApiBaseUrl.replace(/\/$/, "");

export async function getFitnessSyncerStatus(): Promise<FitnessSyncerStatus | null> {
  try {
    return await request<FitnessSyncerStatus>("fitnessSyncerStatus", "GET");
  } catch {
    return null;
  }
}

export async function startFitnessSyncerConnection(): Promise<string> {
  const result = await request<{ authorizationUrl: string }>("fitnessSyncerStart", "POST");
  return result.authorizationUrl;
}

export async function syncFitnessSyncerActivities(): Promise<FitnessSyncerSyncResult> {
  return request<FitnessSyncerSyncResult>("fitnessSyncerSync", "POST");
}

export async function disconnectFitnessSyncer(): Promise<void> {
  await request<{ disconnected: boolean }>("fitnessSyncerDisconnect", "POST");
}

async function request<T>(functionName: string, method: "GET" | "POST"): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Authentication required.");
  const response = await fetch(`${apiBaseUrl}/${functionName}`, {
    headers: { Authorization: `Bearer ${token}` },
    method
  });
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "FitnessSyncer request failed.");
  return body;
}
