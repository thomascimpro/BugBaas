export function createFirebaseTokenVerifier({ apiKey, fetchImpl = fetch } = {}) {
  return async function verifyIdToken(idToken) {
    if (!apiKey) throw new Error("FIREBASE_API_KEY is not configured.");
    const response = await fetchImpl(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });

    if (!response.ok) {
      if (typeof response.text === "function") await response.text().catch(() => "");
      throw new Error(`Firebase token verification failed: ${response.status}`);
    }

    const payload = await response.json();
    const user = Array.isArray(payload?.users) ? payload.users[0] : null;
    if (!user?.localId) throw new Error("Firebase token verification failed: missing user.");
    return {
      uid: String(user.localId),
      email: typeof user.email === "string" ? user.email : ""
    };
  };
}
