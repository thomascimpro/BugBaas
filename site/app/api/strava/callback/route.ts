import { runtimeEnv } from "../../../../lib/runtime";
import { encryptToken, exchangeAuthorizationCode } from "../../../../lib/strava";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  const denied = url.searchParams.get("error");
  const gameUrl = new URL("/game/index.html", request.url);

  if (denied) {
    gameUrl.searchParams.set("strava", "denied");
    return Response.redirect(gameUrl.toString(), 302);
  }
  if (!state || !code) {
    gameUrl.searchParams.set("strava", "invalid");
    return Response.redirect(gameUrl.toString(), 302);
  }

  const database = runtimeEnv().DB;
  const oauthState = await database.prepare(
    "SELECT uid, expires_at FROM strava_oauth_states WHERE state = ?",
  ).bind(state).first<{ expires_at: number; uid: string }>();
  await database.prepare("DELETE FROM strava_oauth_states WHERE state = ?").bind(state).run();
  if (!oauthState || oauthState.expires_at < Math.floor(Date.now() / 1000)) {
    gameUrl.searchParams.set("strava", "expired");
    return Response.redirect(gameUrl.toString(), 302);
  }

  try {
    const redirectUri = new URL("/api/strava/callback", request.url).toString();
    const token = await exchangeAuthorizationCode(code, redirectUri);
    const athleteId = String(token.athlete?.id || "");
    const athleteName = [token.athlete?.firstname, token.athlete?.lastname].filter(Boolean).join(" ");
    const now = new Date().toISOString();
    await database.prepare(
      `INSERT INTO strava_connections
       (uid, athlete_id, athlete_name, access_token, refresh_token, expires_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(uid) DO UPDATE SET
         athlete_id = excluded.athlete_id,
         athlete_name = excluded.athlete_name,
         access_token = excluded.access_token,
         refresh_token = excluded.refresh_token,
         expires_at = excluded.expires_at,
         updated_at = excluded.updated_at`,
    ).bind(
      oauthState.uid,
      athleteId,
      athleteName,
      await encryptToken(token.access_token),
      await encryptToken(token.refresh_token),
      token.expires_at,
      now,
    ).run();
    gameUrl.searchParams.set("strava", "connected");
  } catch {
    gameUrl.searchParams.set("strava", "failed");
  }
  return Response.redirect(gameUrl.toString(), 302);
}
