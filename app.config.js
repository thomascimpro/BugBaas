const appConfig = require("./app.json");

const requiredExtraEnv = {
  firebaseApiKey: "FIREBASE_API_KEY",
  firebaseAuthDomain: "FIREBASE_AUTH_DOMAIN",
  firebaseProjectId: "FIREBASE_PROJECT_ID",
  firebaseMessagingSenderId: "FIREBASE_MESSAGING_SENDER_ID",
  firebaseAppId: "FIREBASE_APP_ID",
  googleClientId: "GOOGLE_CLIENT_ID",
  googleAndroidClientId: "GOOGLE_ANDROID_CLIENT_ID"
};

function readExtra() {
  const extra = Object.fromEntries(
    Object.entries(requiredExtraEnv).map(([key, envName]) => [key, process.env[envName] ?? ""])
  );
  if (process.env.BUGBAAS_REQUIRE_ENV === "1") {
    const missing = Object.entries(requiredExtraEnv)
      .filter(([, envName]) => !process.env[envName])
      .map(([, envName]) => envName);
    if (missing.length) {
      throw new Error(`Missing required BugBaas env vars: ${missing.join(", ")}`);
    }
  }
  return extra;
}

module.exports = () => ({
  ...appConfig.expo,
  extra: {
    ...(appConfig.expo.extra ?? {}),
    ...readExtra(),
    fitnessSyncerApiBaseUrl: process.env.FITNESSSYNCER_API_BASE_URL ?? "https://us-central1-thomascimpro-6266f.cloudfunctions.net",
    realBugScanApiBaseUrl: process.env.REAL_BUG_SCAN_API_BASE_URL ?? "https://bugbaas.vercel.app"
  }
});
