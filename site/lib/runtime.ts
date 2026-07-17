import { env } from "cloudflare:workers";

export type BugBaasEnv = {
  DB: D1Database;
  FIREBASE_API_KEY?: string;
  STRAVA_CLIENT_ID?: string;
  STRAVA_CLIENT_SECRET?: string;
  STRAVA_TOKEN_ENCRYPTION_KEY?: string;
};

export function runtimeEnv(): BugBaasEnv {
  return env as unknown as BugBaasEnv;
}

export function isStravaConfigured(): boolean {
  const current = runtimeEnv();
  return Boolean(current.STRAVA_CLIENT_ID && current.STRAVA_CLIENT_SECRET && current.STRAVA_TOKEN_ENCRYPTION_KEY);
}
