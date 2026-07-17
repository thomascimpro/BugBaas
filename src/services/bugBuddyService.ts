import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";
import { doc, getDoc, runTransaction, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import { BugDexDropResult, BugDexDropSource, clearBugDexInventoryCache, entryByBugId, grantBugDexRewardOnce, prepareBugDexRewardOnceInTransaction } from "./bugDexService";
import { awardBugMasteryXp, awardBugMasteryXpInTransaction, BugMasteryAwardResult, clearBugMasteryCache } from "./bugMasteryService";
import { User } from "../types";

export type BuddyCareAction = "adventure" | "clean" | "feed" | "play" | "train";

export type BuddyCareStats = {
  care: number;
  energy: number;
  happy: number;
};

export type BuddyCareTask = {
  action: BuddyCareAction;
  endsAt: number;
  notificationId?: string;
  startedAt: number;
  xp: number;
};

export type BuddyCareState = {
  actions: Partial<Record<BuddyCareAction, number>>;
  activeTask?: BuddyCareTask;
  day: string;
  lastAction?: BuddyCareAction;
  lastAt?: number;
  lastXp?: number;
  stats: BuddyCareStats;
  switched?: boolean;
  totalXp: number;
};

export type BuddyState = {
  bugId: string;
  care: BuddyCareState;
  updatedAt: string;
};

export type BuddyTaskClaimResult = {
  awardedXp: number;
  drop: BugDexDropResult | null;
  masteryResult: BugMasteryAwardResult;
  state: BuddyState;
};

export const buddyDailyXpCap = 180;
export const buddyCareActions: Array<{ id: BuddyCareAction; label: string; cooldownMs: number; xp: number; stats: Partial<BuddyCareStats> }> = [
  { id: "clean", label: "Voelsprieten poetsen", cooldownMs: 2 * 60 * 60 * 1000, xp: 18, stats: { care: 30, happy: -2 } },
  { id: "feed", label: "Nectar zoeken", cooldownMs: 3 * 60 * 60 * 1000, xp: 28, stats: { energy: 24, happy: 4 } },
  { id: "play", label: "Blad knabbelen", cooldownMs: 4 * 60 * 60 * 1000, xp: 42, stats: { happy: 24, energy: -12, care: -4 } },
  { id: "train", label: "Tunnel graven", cooldownMs: 6 * 60 * 60 * 1000, xp: 70, stats: { energy: -24, happy: -4, care: -8 } },
  { id: "adventure", label: "Zwermtocht", cooldownMs: 12 * 60 * 60 * 1000, xp: 96, stats: { happy: -10, energy: -34, care: -18 } }
];

const dailyHappyDecay = 12;
const minDailyHappy = 35;

const nativeModule = NativeModules.BugBaasNative as { setBuddyWidgetState?: (bugName: string, status: string, xp: number, readyCount: number, actionLabel: string, taskProgress: number, taskRemaining: string, widgetState: string) => Promise<boolean> } | undefined;
const demoBuddyState = new Map<string, BuddyState>();

export function emptyBuddyCareState(day: string): BuddyCareState {
  return { actions: {}, day, stats: { care: 72, energy: 72, happy: 72 }, totalXp: 0 };
}

export function normalizeBuddyCareState(value: Partial<BuddyCareState> | null | undefined, day: string): BuddyCareState {
  if (!value) return emptyBuddyCareState(day);
  if (value.day !== day) {
    const previousStats = normalizeBuddyStats(value.stats);
    const activeTask = sanitizeBuddyTask(value.activeTask);
    return {
      ...emptyBuddyCareState(day),
      ...(activeTask ? { activeTask } : {}),
      stats: {
        ...previousStats,
        happy: Math.max(minDailyHappy, previousStats.happy - dailyHappyDecay)
      }
    };
  }
  const activeTask = sanitizeBuddyTask(value.activeTask);
  const lastAction = isBuddyCareAction(value.lastAction) ? value.lastAction : undefined;
  const lastAt = typeof value.lastAt === "number" && Number.isFinite(value.lastAt) ? Math.floor(value.lastAt) : undefined;
  const lastXp = typeof value.lastXp === "number" && Number.isFinite(value.lastXp) ? Math.max(0, Math.floor(value.lastXp)) : undefined;
  return {
    actions: sanitizeBuddyActions(value.actions),
    ...(activeTask ? { activeTask } : {}),
    day,
    ...(lastAction ? { lastAction } : {}),
    ...(lastAt !== undefined ? { lastAt } : {}),
    ...(lastXp !== undefined ? { lastXp } : {}),
    stats: normalizeBuddyStats(value.stats),
    ...(value.switched === true ? { switched: true } : {}),
    totalXp: Math.max(0, Math.floor(value.totalXp ?? 0))
  };
}

export function parseBuddyCareState(raw: string | null, day: string): BuddyCareState {
  if (!raw) return emptyBuddyCareState(day);
  try {
    return normalizeBuddyCareState(JSON.parse(raw) as Partial<BuddyCareState>, day);
  } catch {
    return emptyBuddyCareState(day);
  }
}

export async function loadBuddyState(uid: string, fallbackBugId: string, day: string, options?: { preferCache?: boolean }): Promise<BuddyState> {
  const cached = await loadCachedBuddyState(uid, fallbackBugId, day);
  if (!isFirebaseConfigured) return demoBuddyState.get(uid) ?? cached;
  if (options?.preferCache && cached.bugId) return cached;

  try {
    const snapshot = await getDoc(doc(db, "users", uid, "buddy", "state"));
    if (!snapshot.exists()) {
      await saveBuddyState(uid, cached);
      return cached;
    }
    const remote = normalizeBuddyState(snapshot.data() as Partial<BuddyState>, fallbackBugId, day);
    await cacheBuddyState(uid, remote);
    await syncBuddyWidget(remote).catch(() => undefined);
    return remote;
  } catch {
    return cached;
  }
}

export async function saveBuddyState(uid: string, state: BuddyState): Promise<void> {
  const clean = normalizeBuddyState(state, state.bugId, state.care.day);
  await cacheBuddyState(uid, clean);
  await syncBuddyWidget(clean).catch(() => undefined);
  if (!isFirebaseConfigured) {
    demoBuddyState.set(uid, clean);
    return;
  }
  await setDoc(doc(db, "users", uid, "buddy", "state"), clean);
}

export async function claimBuddyTaskReward(user: User, state: BuddyState, nowMs = Date.now()): Promise<BuddyTaskClaimResult> {
  const day = localDayId(new Date(nowMs));
  const clean = normalizeBuddyState(state, state.bugId, day);
  const task = clean.care.activeTask;
  if (!task || task.endsAt > nowMs) throw new Error("Buddy task is not ready.");
  const target = entryByBugId(clean.bugId);
  if (!target) throw new Error("Buddy bug not found.");
  const nowIso = new Date(nowMs).toISOString();
  const eventId = `buddy:${day}:${target.id}:${task.action}:${task.startedAt}`;
  const awardedXp = Math.min(Math.max(0, Math.floor(task.xp)), Math.max(0, buddyDailyXpCap - (clean.care.totalXp ?? 0)));

  if (!isFirebaseConfigured) {
    const masteryResult = await awardBugMasteryXp(user, target.id, awardedXp, "buddy_care", eventId);
    const drop = await grantBugDexRewardOnce(user, buddyActionDropSource(task.action), `${eventId}:bugdex`, buddyActionRewardCount(task.action));
    const finalState = completedBuddyState(clean, task, day, awardedXp, masteryResult.awarded, nowIso);
    demoBuddyState.set(user.uid, finalState);
    await cacheBuddyState(user.uid, finalState);
    await syncBuddyWidget(finalState).catch(() => undefined);
    return { awardedXp, drop, masteryResult, state: finalState };
  }

  const buddyRef = doc(db, "users", user.uid, "buddy", "state");
  const result = await runTransaction(db, async (transaction) => {
    const buddySnapshot = await transaction.get(buddyRef);
    const remote = buddySnapshot.exists()
      ? normalizeBuddyState(buddySnapshot.data() as Partial<BuddyState>, clean.bugId, day)
      : clean;
    const remoteTask = remote.care.activeTask;
    if (!remoteTask || remoteTask.startedAt !== task.startedAt || remoteTask.action !== task.action || remoteTask.endsAt > nowMs) {
      throw new Error("Buddy task changed before claim.");
    }
    const remoteAwardedXp = Math.min(Math.max(0, Math.floor(remoteTask.xp)), Math.max(0, buddyDailyXpCap - (remote.care.totalXp ?? 0)));
    const preparedDrop = await prepareBugDexRewardOnceInTransaction(transaction, user, buddyActionDropSource(remoteTask.action), `${eventId}:bugdex`, nowIso, buddyActionRewardCount(remoteTask.action));
    const masteryResult = await awardBugMasteryXpInTransaction(transaction, user, target.id, remoteAwardedXp, "buddy_care", eventId, nowIso);
    const finalState = completedBuddyState(remote, remoteTask, day, remoteAwardedXp, masteryResult.awarded, nowIso);
    transaction.set(buddyRef, finalState);
    preparedDrop.commit();
    return { awardedXp: remoteAwardedXp, drop: preparedDrop.drop, masteryResult, state: finalState };
  });
  await cacheBuddyState(user.uid, result.state);
  await syncBuddyWidget(result.state).catch(() => undefined);
  clearBugMasteryCache(user.uid);
  if (result.drop) clearBugDexInventoryCache(user.uid);
  return result;
}

export function buddyActionDropSource(action: BuddyCareAction): BugDexDropSource {
  if (action === "adventure") return "buddy_epic";
  if (action === "play" || action === "train") return "buddy_rare";
  return "buddy_common";
}

export function buddyActionRewardCount(action: BuddyCareAction): number {
  return action === "train" ? 2 : 1;
}

function normalizeBuddyState(value: Partial<BuddyState>, fallbackBugId: string, day: string): BuddyState {
  return {
    bugId: typeof value.bugId === "string" && value.bugId ? value.bugId : fallbackBugId,
    care: normalizeBuddyCareState(value.care, day),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString()
  };
}

function completedBuddyState(state: BuddyState, task: BuddyCareTask, day: string, awardedXp: number, awarded: boolean, now: string): BuddyState {
  const claimedCare: BuddyCareState = {
    ...state.care,
    day,
    lastAction: task.action,
    lastAt: task.endsAt,
    lastXp: 0
  };
  delete claimedCare.activeTask;
  return {
    bugId: state.bugId,
    care: awarded
      ? { ...claimedCare, lastXp: awardedXp, totalXp: Math.min(buddyDailyXpCap, Math.max(0, (state.care.totalXp ?? 0) + awardedXp)) }
      : claimedCare,
    updatedAt: now
  };
}

function isBuddyCareAction(value: unknown): value is BuddyCareAction {
  return typeof value === "string" && buddyCareActions.some((action) => action.id === value);
}

export function buddyXpMultiplier(stats: BuddyCareStats): number {
  const average = (stats.care + stats.energy + stats.happy) / 3;
  if (Math.min(stats.care, stats.energy, stats.happy) < 25) return 0.7;
  if (average >= 80) return 1.25;
  if (average >= 50) return 1;
  return 0.85;
}

export function applyBuddyCareAction(stats: BuddyCareStats, action: BuddyCareAction): BuddyCareStats {
  const config = buddyCareActions.find((item) => item.id === action);
  if (!config) return normalizeBuddyStats(stats);
  return normalizeBuddyStats({
    care: stats.care + (config.stats.care ?? 0),
    energy: stats.energy + (config.stats.energy ?? 0),
    happy: stats.happy + (config.stats.happy ?? 0)
  });
}

function normalizeBuddyStats(value: Partial<BuddyCareStats> | null | undefined): BuddyCareStats {
  return {
    care: normalizeBuddyStat(value?.care ?? 72),
    energy: normalizeBuddyStat(value?.energy ?? 72),
    happy: normalizeBuddyStat(value?.happy ?? 72)
  };
}

function normalizeBuddyStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 72)));
}

function sanitizeBuddyTask(task: Partial<BuddyCareTask> | null | undefined): BuddyCareTask | undefined {
  if (!task || !isBuddyCareAction(task.action)) return undefined;
  if (typeof task.startedAt !== "number" || typeof task.endsAt !== "number" || typeof task.xp !== "number") return undefined;
  if (!Number.isFinite(task.startedAt) || !Number.isFinite(task.endsAt) || !Number.isFinite(task.xp)) return undefined;
  if (task.endsAt <= task.startedAt) return undefined;
  const clean: BuddyCareTask = {
    action: task.action,
    endsAt: Math.floor(task.endsAt),
    startedAt: Math.floor(task.startedAt),
    xp: Math.max(0, Math.floor(task.xp))
  };
  if (typeof task.notificationId === "string") clean.notificationId = task.notificationId;
  return clean;
}

function sanitizeBuddyActions(actions: Partial<Record<BuddyCareAction, number>> | undefined): Partial<Record<BuddyCareAction, number>> {
  const clean: Partial<Record<BuddyCareAction, number>> = {};
  for (const action of buddyCareActions) {
    const value = actions?.[action.id];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) clean[action.id] = Math.floor(value);
  }
  return clean;
}

async function loadCachedBuddyState(uid: string, fallbackBugId: string, day: string): Promise<BuddyState> {
  const [bugId, rawCare] = await Promise.all([
    AsyncStorage.getItem(buddyStorageKey(uid)).catch(() => null),
    AsyncStorage.getItem(buddyCareStorageKey(uid)).catch(() => null)
  ]);
  return {
    bugId: bugId || fallbackBugId,
    care: parseBuddyCareState(rawCare, day),
    updatedAt: new Date().toISOString()
  };
}

async function cacheBuddyState(uid: string, state: BuddyState): Promise<void> {
  await AsyncStorage.multiSet([
    [buddyStorageKey(uid), state.bugId],
    [buddyCareStorageKey(uid), JSON.stringify(state.care)]
  ]).catch(() => undefined);
}

async function syncBuddyWidget(state: BuddyState): Promise<void> {
  if (Platform.OS !== "android" || !nativeModule?.setBuddyWidgetState) return;
  const entry = entryByBugId(state.bugId);
  const now = Date.now();
  const task = state.care.activeTask;
  const taskFinished = Boolean(task && task.endsAt <= now);
  const taskRunning = Boolean(task && !taskFinished);
  const readyCount = task ? 0 : buddyCareActions.filter((action) => now - (state.care.actions[action.id] ?? 0) >= action.cooldownMs).length;
  const actionLabel = task ? buddyCareActions.find((action) => action.id === task.action)?.label : undefined;
  const taskProgress = task ? taskProgressPercent(task.startedAt, task.endsAt, now) : 0;
  const taskRemaining = taskRunning && task ? formatWidgetRemaining(task.endsAt - now) : "";
  const widgetState = taskFinished ? "reward_ready" : taskRunning ? "expedition" : readyCount > 0 ? "available" : "resting";
  const status = taskFinished ? "Reward klaar" : taskRunning ? `${actionLabel ?? "Expeditie"} bezig` : readyCount > 0 ? "Klaar voor expeditie" : "Buddy rust even";
  await nativeModule.setBuddyWidgetState(entry?.name ?? "Bug Buddy", status, state.care.totalXp, readyCount, actionLabel ?? "", taskProgress, taskRemaining, widgetState);
}

function taskProgressPercent(startedAt: number, endsAt: number, now: number): number {
  const duration = Math.max(1, endsAt - startedAt);
  return Math.max(0, Math.min(100, Math.round(((now - startedAt) / duration) * 100)));
}

function formatWidgetRemaining(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  if (minutes >= 60) return `${Math.ceil(minutes / 60)}h`;
  return `${minutes}m`;
}

function localDayId(date = new Date()): string {
  return date.toLocaleDateString("en-CA");
}

function buddyStorageKey(uid: string) {
  return `bugbaas:buddy:${uid}`;
}

function buddyCareStorageKey(uid: string) {
  return `bugbaas:buddyCare:${uid}`;
}
