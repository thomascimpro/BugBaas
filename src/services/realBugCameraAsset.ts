export type RealBugPhotoAsset = {
  uri: string;
  width: number;
  height: number;
};

export function normalizeRealBugCameraAsset(photo: { uri?: string; width?: number; height?: number }): RealBugPhotoAsset {
  const uri = String(photo.uri ?? "").trim();
  if (!uri) throw new Error("Ongeldig cameraresultaat ontvangen.");
  return {
    uri,
    width: Number.isFinite(photo.width) ? Math.max(0, Number(photo.width)) : 0,
    height: Number.isFinite(photo.height) ? Math.max(0, Number(photo.height)) : 0
  };
}
