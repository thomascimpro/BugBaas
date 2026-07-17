import { requireFirebaseUid, routeError } from "../../../../lib/firebase-auth";
import { isStravaConfigured, runtimeEnv } from "../../../../lib/runtime";

export async function GET(request: Request) {
  try {
    const uid = await requireFirebaseUid(request);
    const connection = await runtimeEnv().DB.prepare(
      "SELECT athlete_name, last_sync_at FROM strava_connections WHERE uid = ?",
    ).bind(uid).first<{ athlete_name: string | null; last_sync_at: string | null }>();
    return Response.json({
      athleteName: connection?.athlete_name || undefined,
      configured: isStravaConfigured(),
      connected: Boolean(connection),
      lastSyncAt: connection?.last_sync_at || undefined,
    });
  } catch (error) {
    return routeError(error);
  }
}
