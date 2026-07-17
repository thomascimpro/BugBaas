import { User } from "../types";

export const bugLampStreakLength = 5;
export const bugLampDurationMs = 12 * 60 * 60 * 1000;
export const bugLampMovementBoost = 1;
export const bugLampRarityBoost = 0.025;

export type BugLampStatus = {
  active: boolean;
  activeUntil?: string;
  count: number;
  movementBoost: number;
  rarityBoost: number;
  remainingMs: number;
};

export function bugLampStatus(user?: Pick<User, "bugLampActiveUntil" | "bugLampCount"> | null, now = Date.now()): BugLampStatus {
  const count = normalizeBugLampCount(user?.bugLampCount);
  const activeUntil = validActiveUntil(user?.bugLampActiveUntil);
  const remainingMs = activeUntil ? Math.max(0, Date.parse(activeUntil) - now) : 0;
  const active = remainingMs > 0;
  return {
    active,
    activeUntil: active ? activeUntil : undefined,
    count,
    movementBoost: active ? bugLampMovementBoost : 0,
    rarityBoost: active ? bugLampRarityBoost : 0,
    remainingMs
  };
}

export function normalizeBugLampCount(count: number | undefined): number {
  return Math.max(0, Math.floor(Number.isFinite(count) ? Number(count) : 0));
}

export function normalizeBugLampActiveUntil(activeUntil: string | undefined): string | undefined {
  return validActiveUntil(activeUntil);
}

export function shouldAwardBugLamp(streakDay: number): boolean {
  return streakDay > 0 && streakDay % bugLampStreakLength === 0;
}

export function withAwardedBugLamp<T extends Pick<User, "bugLampCount">>(user: T, amount = 1): T {
  return {
    ...user,
    bugLampCount: normalizeBugLampCount(user.bugLampCount) + Math.max(0, amount)
  };
}

export function withActivatedBugLamp<T extends Pick<User, "bugLampActiveUntil" | "bugLampCount">>(user: T, now = Date.now()): T {
  const status = bugLampStatus(user, now);
  if (status.active) throw new Error("Bug Lamp is al actief.");
  if (status.count < 1) throw new Error("Je hebt geen Bug Lamp.");
  return {
    ...user,
    bugLampActiveUntil: new Date(now + bugLampDurationMs).toISOString(),
    bugLampCount: status.count - 1
  };
}

export function movementBoostWithBugLamp(user: Pick<User, "activeBugSquad" | "bugLampActiveUntil" | "bugLampCount"> | undefined, squadMovementBoost: number): number {
  const lamp = bugLampStatus(user);
  return Math.min(1, Math.max(0, squadMovementBoost) + lamp.movementBoost);
}

function validActiveUntil(activeUntil: string | undefined): string | undefined {
  if (!activeUntil) return undefined;
  return Number.isFinite(Date.parse(activeUntil)) ? activeUntil : undefined;
}
