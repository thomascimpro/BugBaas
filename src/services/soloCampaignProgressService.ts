import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import { soloCampaignMaxWave } from "./soloCampaignBalance";

export type SoloCampaignProgress = {
  lives: number;
  updatedAt: string;
  wave: number;
};

const soloCampaignStartingLives = 3;
const storageKey = (uid: string) => `bugbaas:soloCampaignProgress:${uid}`;
const legacyWaveStorageKey = (uid: string) => `bugbaas:soloCampaignWave:${uid}`;

export function defaultSoloCampaignProgress(): SoloCampaignProgress {
  return {
    lives: soloCampaignStartingLives,
    updatedAt: new Date(0).toISOString(),
    wave: 1
  };
}

export async function loadSoloCampaignProgress(uid: string): Promise<SoloCampaignProgress> {
  if (isFirebaseConfigured) {
    try {
      const snapshot = await getDoc(progressRef(uid));
      if (snapshot.exists()) {
        const progress = normalize(snapshot.data());
        await saveLocal(uid, progress);
        return progress;
      }
    } catch {
      // Fall back to local progress below.
    }
  }

  const local = await loadLocal(uid);
  if (isFirebaseConfigured) await saveSoloCampaignProgress(uid, local).catch(() => undefined);
  return local;
}

export async function saveSoloCampaignProgress(uid: string, progress: Partial<SoloCampaignProgress>): Promise<SoloCampaignProgress> {
  const next = normalize({
    ...progress,
    updatedAt: new Date().toISOString()
  });
  await saveLocal(uid, next);
  if (isFirebaseConfigured) await setDoc(progressRef(uid), next);
  return next;
}

function progressRef(uid: string) {
  return doc(db, "users", uid, "soloCampaign", "progress");
}

async function loadLocal(uid: string): Promise<SoloCampaignProgress> {
  const raw = await AsyncStorage.getItem(storageKey(uid));
  if (!raw) return loadLegacyLocal(uid);
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return loadLegacyLocal(uid);
  }
}

async function loadLegacyLocal(uid: string): Promise<SoloCampaignProgress> {
  const rawWave = await AsyncStorage.getItem(legacyWaveStorageKey(uid));
  const wave = Number(rawWave);
  return normalize({
    lives: soloCampaignStartingLives,
    updatedAt: new Date(0).toISOString(),
    wave: Number.isFinite(wave) ? wave : 1
  });
}

async function saveLocal(uid: string, progress: SoloCampaignProgress): Promise<void> {
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(normalize(progress)));
}

function normalize(value: Partial<SoloCampaignProgress>): SoloCampaignProgress {
  return {
    lives: Math.max(1, Math.min(soloCampaignStartingLives, Math.floor(Number(value.lives) || soloCampaignStartingLives))),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
    wave: Math.max(1, Math.min(soloCampaignMaxWave, Math.floor(Number(value.wave) || 1)))
  };
}
