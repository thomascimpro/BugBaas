import { User } from "../types";

export const starterBoostDurationMs = 3 * 24 * 60 * 60 * 1000;
export const starterBoostMaxActivePoints = 300;
export const starterBoostMaxStartingXp = 80;
export const starterBoostXpMultiplier = 2;

export function isStarterBoostActive(user: Pick<User, "starterBoostActiveUntil">, now = Date.now()): boolean {
  const until = Date.parse(user.starterBoostActiveUntil ?? "");
  return Number.isFinite(until) && until > now;
}

export function starterBoostedXp(user: Pick<User, "starterBoostActiveUntil" | "totalPoints">, xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) return xp;
  return isStarterBoostActive(user) && user.totalPoints < starterBoostMaxActivePoints ? Math.round(xp * starterBoostXpMultiplier) : xp;
}

export function starterBoostRemainingDays(user: Pick<User, "starterBoostActiveUntil">): number {
  const until = Date.parse(user.starterBoostActiveUntil ?? "");
  if (!Number.isFinite(until)) return 0;
  return Math.max(0, Math.ceil((until - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function withStarterBoostIfEligible(user: User, now = Date.now()): User {
  if (user.starterBoostGrantedAt || user.totalPoints >= starterBoostMaxStartingXp) return user;
  const grantedAt = new Date(now).toISOString();
  return {
    ...user,
    starterBoostActiveUntil: new Date(now + starterBoostDurationMs).toISOString(),
    starterBoostGrantedAt: grantedAt
  };
}
