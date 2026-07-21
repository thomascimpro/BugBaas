import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import type { User } from "../types";
import { realBugScanDayKey, type RealBugScanResponse } from "./realBugScanContract";
import { isDailyRealBugScanSuccess } from "./realBugScanProgressPolicy";

const demoProgress = new Set<string>();

export async function recordDailyRealBugScanProgress(user: User, result: RealBugScanResponse): Promise<void> {
  if (!isDailyRealBugScanSuccess(result.status)) return;
  const day = realBugScanDayKey();
  if (!isFirebaseConfigured) {
    demoProgress.add(`${user.uid}:${day}`);
    return;
  }
  const progressRef = doc(db, "users", user.uid, "realBugScanProgress", day);
  if ((await getDoc(progressRef)).exists()) return;
  await setDoc(progressRef, {
    completed: true,
    completedAt: new Date().toISOString(),
    day,
    scanId: result.scanId,
    status: result.status,
    userId: user.uid
  });
}

export async function getDailyRealBugScanProgress(user: User, date = new Date()): Promise<number> {
  const day = realBugScanDayKey(date);
  if (!isFirebaseConfigured) return demoProgress.has(`${user.uid}:${day}`) ? 1 : 0;
  const snapshot = await getDoc(doc(db, "users", user.uid, "realBugScanProgress", day));
  return snapshot.exists() && snapshot.data().completed === true ? 1 : 0;
}
