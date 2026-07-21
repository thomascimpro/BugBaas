import Constants from "expo-constants";
import { Platform } from "react-native";
import { auth } from "../firebase";

export type FitnessSyncerConfigurationKey = "client_id" | "client_secret" | "token_key";

export type FitnessSyncerStatus = {
  configured: boolean;
  connected: boolean;
  credentialsConfigured?: boolean;
  lastError?: string;
  lastSyncAt?: string;
  missingConfiguration?: FitnessSyncerConfigurationKey[];
  serverReady?: boolean;
};

export type FitnessSyncerSyncResult = {
  importedActivities: number;
  todayKm: number;
  todaySteps: number;
  weekKm: number;
  weekSteps: number;
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
  const result = await request<{ authorizationUrl: string }>("fitnessSyncerStart", "POST", {
    returnUrl: fitnessSyncerReturnUrl()
  });
  return result.authorizationUrl;
}

export async function saveFitnessSyncerCredentials(clientId: string, clientSecret: string): Promise<FitnessSyncerStatus> {
  return request<FitnessSyncerStatus>("fitnessSyncerConfigure", "POST", { clientId, clientSecret });
}

export async function clearFitnessSyncerCredentials(): Promise<FitnessSyncerStatus> {
  return request<FitnessSyncerStatus>("fitnessSyncerClearConfiguration", "POST");
}

export async function syncFitnessSyncerActivities(): Promise<FitnessSyncerSyncResult> {
  return request<FitnessSyncerSyncResult>("fitnessSyncerSync", "POST");
}

export async function disconnectFitnessSyncer(): Promise<void> {
  await request<{ disconnected: boolean }>("fitnessSyncerDisconnect", "POST");
}

function fitnessSyncerReturnUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") return `${window.location.origin}/`;
  return "bugbaas://settings";
}

async function request<T>(functionName: string, method: "GET" | "POST", payload?: Record<string, unknown>): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Authentication required.");
  const response = await fetch(`${apiBaseUrl}/${functionName}`, {
    ...(payload ? { body: JSON.stringify(payload) } : {}),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(payload ? { "Content-Type": "application/json" } : {})
    },
    method
  });
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "FitnessSyncer request failed.");
  return body;
}
