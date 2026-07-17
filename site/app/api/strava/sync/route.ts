import { requireFirebaseUid, routeError } from "../../../../lib/firebase-auth";
import { runtimeEnv } from "../../../../lib/runtime";
import { decryptToken, refreshConnection, StravaConnection } from "../../../../lib/strava";

type StravaActivity = {
  distance?: number;
  id: number;
  sport_type?: string;
  start_date_local?: string;
  type?: string;
};

const walkingTypes = new Set(["Walk", "Hike"]);
const runningTypes = new Set(["Run", "TrailRun", "VirtualRun"]);
const cyclingTypes = new Set(["Ride", "MountainBikeRide", "GravelRide", "VirtualRide", "EBikeRide"]);

export async function POST(request: Request) {
  try {
    const uid = await requireFirebaseUid(request);
    const database = runtimeEnv().DB;
    const stored = await database.prepare(
      "SELECT * FROM strava_connections WHERE uid = ?",
    ).bind(uid).first<StravaConnection>();
    if (!stored) return Response.json({ error: "Connect Strava first." }, { status: 409 });

    const connection = await refreshConnection(stored);
    const activities = await fetchActivities(await decryptToken(connection.access_token));
    let importedActivities = 0;
    for (const activity of activities) {
      const sportType = activity.sport_type || activity.type || "";
      if (!activity.start_date_local || !activity.distance || !categoryFor(sportType)) continue;
      const result = await database.prepare(
        "INSERT OR IGNORE INTO strava_activities (uid, activity_id, sport_type, distance_meters, start_date_local) VALUES (?, ?, ?, ?, ?)",
      ).bind(uid, String(activity.id), sportType, Math.max(0, Math.round(activity.distance)), activity.start_date_local).run();
      importedActivities += Number(result.meta.changes || 0);
    }

    const todayId = localDateId(new Date());
    const weekStartId = localWeekStartId(new Date());
    const rows = await database.prepare(
      "SELECT sport_type, distance_meters, start_date_local FROM strava_activities WHERE uid = ? AND substr(start_date_local, 1, 10) >= ?",
    ).bind(uid, weekStartId).all<{ distance_meters: number; sport_type: string; start_date_local: string }>();
    const today = emptyKilometers();
    const week = emptyKilometers();
    for (const row of rows.results) {
      addDistance(week, row.sport_type, row.distance_meters);
      if (row.start_date_local.slice(0, 10) === todayId) addDistance(today, row.sport_type, row.distance_meters);
    }
    const now = new Date().toISOString();
    await database.prepare("UPDATE strava_connections SET last_sync_at = ?, updated_at = ? WHERE uid = ?").bind(now, now, uid).run();
    return Response.json({
      athleteName: connection.athlete_name || undefined,
      importedActivities,
      today: roundKilometers(today),
      week: roundKilometers(week),
    });
  } catch (error) {
    return routeError(error);
  }
}

async function fetchActivities(accessToken: string): Promise<StravaActivity[]> {
  const after = Math.floor((Date.now() - 10 * 24 * 60 * 60 * 1000) / 1000);
  const activities: StravaActivity[] = [];
  for (let page = 1; page <= 3; page += 1) {
    const url = new URL("https://www.strava.com/api/v3/athlete/activities");
    url.searchParams.set("after", String(after));
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "100");
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const payload = await response.json() as StravaActivity[] | { message?: string };
    if (!response.ok || !Array.isArray(payload)) throw new Error("Could not retrieve Strava activities.");
    activities.push(...payload);
    if (payload.length < 100) break;
  }
  return activities;
}

function categoryFor(sportType: string): "cycling" | "running" | "walking" | null {
  if (walkingTypes.has(sportType)) return "walking";
  if (runningTypes.has(sportType)) return "running";
  if (cyclingTypes.has(sportType)) return "cycling";
  return null;
}

function emptyKilometers() {
  return { cycling: 0, running: 0, total: 0, walking: 0 };
}

function addDistance(target: ReturnType<typeof emptyKilometers>, sportType: string, distanceMeters: number) {
  const category = categoryFor(sportType);
  if (!category) return;
  const kilometers = Math.max(0, distanceMeters) / 1000;
  target[category] += kilometers;
  target.total += kilometers;
}

function roundKilometers(value: ReturnType<typeof emptyKilometers>) {
  return Object.fromEntries(Object.entries(value).map(([key, km]) => [key, Math.round(km * 100) / 100]));
}

function localDateId(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function localWeekStartId(date: Date): string {
  const parts = localDateId(date).split("-").map(Number);
  const localUtc = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const dayOffset = (localUtc.getUTCDay() + 6) % 7;
  localUtc.setUTCDate(localUtc.getUTCDate() - dayOffset);
  return localUtc.toISOString().slice(0, 10);
}
