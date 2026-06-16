const appConfig = require("./app.json");
const fs = require("fs");
const path = require("path");

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
  loadDotEnv();
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

function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

module.exports = () => ({
  ...appConfig.expo,
  extra: {
    ...(appConfig.expo.extra ?? {}),
    ...readExtra()
  }
});
