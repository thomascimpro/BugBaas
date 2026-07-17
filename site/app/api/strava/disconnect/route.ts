import { requireFirebaseUid, routeError } from "../../../../lib/firebase-auth";
import { runtimeEnv } from "../../../../lib/runtime";
import { decryptToken, StravaConnection } from "../../../../lib/strava";

export async function POST(request: Request) {
  try {
    const uid = await requireFirebaseUid(request);
    const current = runtimeEnv();
    const connection = await current.DB.prepare(
      "SELECT * FROM strava_connections WHERE uid = ?",
    ).bind(uid).first<StravaConnection>();
    if (connection && current.STRAVA_CLIENT_ID && current.STRAVA_CLIENT_SECRET) {
      const basic = btoa(`${current.STRAVA_CLIENT_ID}:${current.STRAVA_CLIENT_SECRET}`);
      await fetch("https://www.strava.com/oauth/revoke", {
        body: new URLSearchParams({ token: await decryptToken(connection.refresh_token), token_type_hint: "refresh_token" }),
        headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
        method: "POST",
      }).catch(() => undefined);
    }
    await current.DB.batch([
      current.DB.prepare("DELETE FROM strava_activities WHERE uid = ?").bind(uid),
      current.DB.prepare("DELETE FROM strava_connections WHERE uid = ?").bind(uid),
    ]);
    return Response.json({ disconnected: true });
  } catch (error) {
    return routeError(error);
  }
}
