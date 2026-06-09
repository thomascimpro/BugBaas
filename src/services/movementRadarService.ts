import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";
import { BugArtId } from "./bugArt";

export type MovementRadarResult = {
  awarded: number;
  bugIds: BugArtId[];
  estimatedKm: number;
  reason?: string;
};

export type MovementRadarGoal = {
  earned: number;
  id: "walking" | "running" | "cycling";
  km: number;
  label: string;
  targetKm: number;
};

export type MovementDataTypeStatus = {
  available: boolean;
  id: "steps" | "distance" | "exercise";
  label: string;
  lastSeenAt?: number;
  lastSeenLabel?: string;
  reason?: "health_connect_unavailable" | "health_permission" | "health_error" | "no_data" | string;
};

export type MovementRadarProgress = {
  available: boolean;
  awardedToday: number;
  claimableRewards: number;
  dataTypes?: MovementDataTypeStatus[];
  goals: MovementRadarGoal[];
  maxRewards: number;
  reason?: string;
};

const nativeModule = NativeModules.BugBaasNative as {
  claimMovementRadarBonuses?: (movementBoost: number) => Promise<MovementRadarResult>;
  claimMovementRadarBonusesForApp?: (movementBoost: number) => Promise<MovementRadarResult>;
  claimQueuedRadarBugs?: () => Promise<BugArtId[]>;
  getMovementRadarProgress?: (movementBoost: number) => Promise<MovementRadarProgress>;
  getQueuedRadarBugIds?: () => Promise<BugArtId[]>;
  requestHealthPermissions?: () => Promise<boolean>;
} | undefined;

const walkingMetersPerRadarBug = 2500;
const runningMetersPerRadarBug = 4000;
const cyclingMetersPerRadarBug = 6000;
const maxMovementRadarBugsPerDay = 5;

export async function claimMovementRadarBonuses(uid: string, movementBoost = 0): Promise<MovementRadarResult> {
  if (Platform.OS !== "android") return emptyResult("platform");
  if (!nativeModule?.claimMovementRadarBonuses) return emptyResult("native");

  const nativeResult = await nativeModule.claimMovementRadarBonuses(clampBoost(movementBoost));
  if (nativeResult.reason === "health_permission" && await requestHealthConnectPermissionsOnce(uid)) {
    return emptyResult("health_permission_requested");
  }
  return nativeResult;
}

export async function claimMovementRadarBonusesForApp(uid: string, movementBoost = 0): Promise<MovementRadarResult> {
  if (Platform.OS !== "android") return emptyResult("platform");
  if (!nativeModule?.claimMovementRadarBonusesForApp) return claimMovementRadarBonuses(uid, movementBoost);

  const nativeResult = await nativeModule.claimMovementRadarBonusesForApp(clampBoost(movementBoost));
  if (nativeResult.reason === "health_permission" && await requestHealthConnectPermissionsOnce(uid)) {
    return emptyResult("health_permission_requested");
  }
  return nativeResult;
}

export async function getQueuedRadarBugIds(): Promise<BugArtId[]> {
  if (Platform.OS !== "android" || !nativeModule?.getQueuedRadarBugIds) return [];
  return nativeModule.getQueuedRadarBugIds();
}

export async function claimQueuedRadarBugs(): Promise<BugArtId[]> {
  if (Platform.OS !== "android" || !nativeModule?.claimQueuedRadarBugs) return [];
  return nativeModule.claimQueuedRadarBugs();
}

export async function getMovementRadarProgress(_uid: string, movementBoost = 0): Promise<MovementRadarProgress> {
  if (Platform.OS !== "android") return emptyProgress("platform");
  if (!nativeModule?.getMovementRadarProgress) return emptyProgress("native");
  return nativeModule.getMovementRadarProgress(clampBoost(movementBoost));
}

async function requestHealthConnectPermissionsOnce(uid: string): Promise<boolean> {
  if (!nativeModule?.requestHealthPermissions) return false;
  const key = `movement-radar-health-permission-requested:${uid}`;
  const alreadyRequested = await AsyncStorage.getItem(key);
  if (alreadyRequested === "true") return false;
  const opened = await nativeModule.requestHealthPermissions();
  if (opened) await AsyncStorage.setItem(key, "true");
  return opened;
}

function emptyResult(reason: string): MovementRadarResult {
  return { awarded: 0, bugIds: [], estimatedKm: 0, reason };
}

function emptyProgress(reason: string): MovementRadarProgress {
  return {
    available: false,
    awardedToday: 0,
    claimableRewards: 0,
    dataTypes: [
      { available: false, id: "steps", label: "Stappen", reason },
      { available: false, id: "distance", label: "Afstand", reason },
      { available: false, id: "exercise", label: "Trainingen", reason }
    ],
    goals: [
      makeGoal("walking", "Lopen", 0, walkingMetersPerRadarBug, 0),
      makeGoal("running", "Hardlopen", 0, runningMetersPerRadarBug, 0),
      makeGoal("cycling", "Fietsen", 0, cyclingMetersPerRadarBug, 0)
    ],
    maxRewards: maxMovementRadarBugsPerDay,
    reason
  };
}

function makeGoal(id: MovementRadarGoal["id"], label: string, meters: number, targetMeters: number, earned: number): MovementRadarGoal {
  return {
    earned,
    id,
    km: Math.max(0, meters) / 1000,
    label,
    targetKm: targetMeters / 1000
  };
}

function clampBoost(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
