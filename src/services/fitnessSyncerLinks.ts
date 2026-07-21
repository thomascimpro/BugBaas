export type FitnessSyncerSetupPlatform = "android" | "ios" | "web";

export const fitnessSyncerSetupUrl = "https://www.fitnesssyncer.com/account/developer/app";
export const fitnessSyncerCallbackUrl = "https://us-central1-thomascimpro-6266f.cloudfunctions.net/fitnessSyncerCallback";

export function fitnessSyncerSetupKeys(platform: FitnessSyncerSetupPlatform): string[] {
  const sourceKey = platform === "android"
    ? "settings.fitnessSetupAndroid"
    : platform === "ios"
      ? "settings.fitnessSetupIos"
      : "settings.fitnessSetupWeb";

  return [
    sourceKey,
    "settings.fitnessSetupPermissions",
    "settings.fitnessSetupDeveloper",
    "settings.fitnessSetupConnect",
    "settings.fitnessSetupSync"
  ];
}
