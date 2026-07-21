import AsyncStorage from "@react-native-async-storage/async-storage";

function storageKey(uid: string, dayKey: string): string {
  return `bugbaas:realBugScanFingerprints:${uid}:${dayKey}`;
}

async function readFingerprints(uid: string, dayKey: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid, dayKey));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function hasRealBugScanFingerprint(uid: string, dayKey: string, fingerprint: string): Promise<boolean> {
  return (await readFingerprints(uid, dayKey)).includes(fingerprint);
}

export async function rememberRealBugScanFingerprint(uid: string, dayKey: string, fingerprint: string): Promise<void> {
  const current = await readFingerprints(uid, dayKey);
  if (current.includes(fingerprint)) return;
  await AsyncStorage.setItem(storageKey(uid, dayKey), JSON.stringify([...current, fingerprint].slice(-3)));
}
