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
  return Object.fromEntries(
    Object.entries(requiredExtraEnv).map(([key, envName]) => [key, process.env[envName] ?? ""])
  );
}

module.exports = () => ({
  ...appConfig.expo,
  extra: {
    ...(appConfig.expo.extra ?? {}),
    ...readExtra()
  }
});
