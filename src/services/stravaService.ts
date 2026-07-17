import { Platform } from "react-native";
import { auth } from "../firebase";

export type StravaKilometers = {
  cycling: number;
  running: number;
  total: number;
  walking: number;
};

export type StravaStatus = {
  athleteName?: string;
  connected: boolean;
  configured: boolean;
  lastSyncAt?: string;
};

export type StravaSyncResult = {
  athleteName?: string;
  importedActivities: number;
  today: StravaKilometers;
  week: StravaKilometers;
};

async function authorizationHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in to BugBaas first.");
  return {
    Authorization: `Bearer ${await currentUser.getIdToken()}`,
    "Content-Type": "application/json"
  };
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (Platform.OS !== "web") throw new Error("Strava is only available in the web version.");
  const response = await fetch(path, {
    ...init,
    headers: { ...await authorizationHeaders(), ...(init?.headers ?? {}) }
  });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "Strava request failed.");
  return payload;
}

export async function getStravaStatus(): Promise<StravaStatus> {
  return apiRequest<StravaStatus>("/api/strava/status");
}

export async function connectStrava(): Promise<void> {
  const result = await apiRequest<{ authorizationUrl: string }>("/api/strava/connect", { method: "POST" });
  window.location.assign(result.authorizationUrl);
}

export async function syncStravaKilometers(): Promise<StravaSyncResult> {
  return apiRequest<StravaSyncResult>("/api/strava/sync", { method: "POST" });
}

export async function disconnectStrava(): Promise<void> {
  await apiRequest<{ disconnected: true }>("/api/strava/disconnect", { method: "POST" });
}
