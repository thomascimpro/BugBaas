import { requireFirebaseUid, routeError } from "../../../../lib/firebase-auth";
import { isStravaConfigured, runtimeEnv } from "../../../../lib/runtime";
import { stravaAuthorizationUrl } from "../../../../lib/strava";

export async function POST(request: Request) {
  try {
    if (!isStravaConfigured()) return Response.json({ error: "Strava is not configured yet." }, { status: 503 });
    const uid = await requireFirebaseUid(request);
    const state = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60;
    await runtimeEnv().DB.prepare(
      "INSERT INTO strava_oauth_states (state, uid, expires_at) VALUES (?, ?, ?)",
    ).bind(state, uid, expiresAt).run();
    return Response.json({ authorizationUrl: stravaAuthorizationUrl(request, state) });
  } catch (error) {
    return routeError(error);
  }
}
