import { doc, getDoc, runTransaction, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";

export type SoloCampaignBossProgress = {
  dayCount: number;
  dayId: string;
  updatedAt: string;
  weekCount: number;
  weekId: string;
};

const demoProgress = new Map<string, SoloCampaignBossProgress>();
const progressId = "soloCampaignBosses";

export async function loadSoloCampaignBossProgress(uid: string): Promise<SoloCampaignBossProgress> {
  if (!isFirebaseConfigured) return normalizeProgress(demoProgress.get(uid));
  const snapshot = await getDoc(progressRef(uid));
  return normalizeProgress(snapshot.exists() ? snapshot.data() as Partial<SoloCampaignBossProgress> : undefined);
}

export async function recordSoloCampaignBossDefeated(uid: string): Promise<SoloCampaignBossProgress> {
  const now = new Date().toISOString();
  const dayId = localDayId();
  const weekId = isoWeekId();

  if (!isFirebaseConfigured) {
    const current = normalizeProgress(demoProgress.get(uid));
    const next = incrementProgress(current, dayId, weekId, now);
    demoProgress.set(uid, next);
    return next;
  }

  return runTransaction(db, async (transaction) => {
    const ref = progressRef(uid);
    const snapshot = await transaction.get(ref);
    const next = incrementProgress(normalizeProgress(snapshot.exists() ? snapshot.data() as Partial<SoloCampaignBossProgress> : undefined), dayId, weekId, now);
    transaction.set(ref, next);
    return next;
  });
}

function progressRef(uid: string) {
  return doc(db, "users", uid, "missionProgress", progressId);
}

function incrementProgress(current: SoloCampaignBossProgress, dayId: string, weekId: string, updatedAt: string): SoloCampaignBossProgress {
  return {
    dayCount: current.dayId === dayId ? current.dayCount + 1 : 1,
    dayId,
    updatedAt,
    weekCount: current.weekId === weekId ? current.weekCount + 1 : 1,
    weekId
  };
}

function normalizeProgress(value?: Partial<SoloCampaignBossProgress>): SoloCampaignBossProgress {
  const dayId = localDayId();
  const weekId = isoWeekId();
  return {
    dayCount: value?.dayId === dayId ? Math.max(0, Math.floor(Number(value.dayCount) || 0)) : 0,
    dayId: typeof value?.dayId === "string" ? value.dayId : dayId,
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : new Date(0).toISOString(),
    weekCount: value?.weekId === weekId ? Math.max(0, Math.floor(Number(value.weekCount) || 0)) : 0,
    weekId: typeof value?.weekId === "string" ? value.weekId : weekId
  };
}

export function localDayId(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isoWeekId(date = new Date()): string {
  const next = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = next.getUTCDay() || 7;
  next.setUTCDate(next.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(next.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((next.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${next.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}
