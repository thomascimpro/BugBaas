export function realBugScanFingerprint(imageDataUrl: string): string {
  let hashA = 2166136261;
  let hashB = 2166136261 ^ imageDataUrl.length;
  for (let index = 0; index < imageDataUrl.length; index += 1) {
    const code = imageDataUrl.charCodeAt(index);
    hashA ^= code;
    hashA = Math.imul(hashA, 16777619);
    hashB ^= code + index;
    hashB = Math.imul(hashB, 2246822519);
  }
  return `${imageDataUrl.length.toString(36)}-${(hashA >>> 0).toString(36)}-${(hashB >>> 0).toString(36)}`;
}
