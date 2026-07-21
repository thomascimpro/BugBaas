const catalog = require("../shared/bugdex-catalog.js");

let configuredHandler;

async function getHandler() {
  if (configuredHandler) return configuredHandler;
  const [handlerModule, openaiModule, firebaseModule, usageModule] = await Promise.all([
    import("../server/realBugScan/handler.mjs"),
    import("../server/realBugScan/openaiVision.mjs"),
    import("../server/realBugScan/firebaseTokenVerifier.mjs"),
    import("../server/realBugScan/firebaseUsageStore.mjs")
  ]);

  const allowedOrigins = String(process.env.BUG_SCAN_ALLOWED_ORIGINS || "https://bugbaas.vercel.app")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const usageStore = usageModule.createFirebaseUsageStore({
    projectId: process.env.FIREBASE_PROJECT_ID
  });

  configuredHandler = handlerModule.createRealBugIdentifyHandler({
    catalog,
    allowedOrigins,
    verifyIdToken: firebaseModule.createFirebaseTokenVerifier({
      apiKey: process.env.FIREBASE_API_KEY
    }),
    reserveUsage: usageStore.reserve,
    identifyImage: openaiModule.createOpenAIImageIdentifier({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_BUG_SCAN_MODEL || "gpt-5-mini"
    })
  });
  return configuredHandler;
}

module.exports = async function realBugIdentifyApi(request, response) {
  const handler = await getHandler();
  return handler(request, response);
};
