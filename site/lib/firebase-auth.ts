import { runtimeEnv } from "./runtime";

type FirebaseLookupResponse = {
  error?: { message?: string };
  users?: Array<{ localId?: string }>;
};

export async function requireFirebaseUid(request: Request): Promise<string> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Response(JSON.stringify({ error: "BugBaas sign-in required." }), { status: 401 });

  const apiKey = runtimeEnv().FIREBASE_API_KEY;
  if (!apiKey) throw new Response(JSON.stringify({ error: "Firebase server configuration is missing." }), { status: 503 });

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    body: JSON.stringify({ idToken: token }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload = await response.json() as FirebaseLookupResponse;
  const uid = payload.users?.[0]?.localId;
  if (!response.ok || !uid) throw new Response(JSON.stringify({ error: "Your BugBaas session expired." }), { status: 401 });
  return uid;
}

export function routeError(error: unknown): Response {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return Response.json({ error: message }, { status: 500 });
}
