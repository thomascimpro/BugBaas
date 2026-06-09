import { User } from "../types";

export const presenceOnlineWindowMs = 5 * 60 * 1000;

export function isUserOnline(user: Pick<User, "lastActiveAt">, now = Date.now()): boolean {
  const timestamp = user.lastActiveAt ? Date.parse(user.lastActiveAt) : Number.NaN;
  return Number.isFinite(timestamp) && now - timestamp <= presenceOnlineWindowMs;
}

export function presenceLabel(user: Pick<User, "lastActiveAt">, t: (key: string, params?: Record<string, string | number>) => string, now = Date.now()): string {
  const timestamp = user.lastActiveAt ? Date.parse(user.lastActiveAt) : Number.NaN;
  if (!Number.isFinite(timestamp)) return t("presence.offline");

  const diffMs = Math.max(0, now - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs <= presenceOnlineWindowMs) return t("presence.online");
  if (diffMs < hour) return t("presence.minutesAgo", { count: Math.max(1, Math.floor(diffMs / minute)) });
  if (diffMs < day) return t("presence.hoursAgo", { count: Math.max(1, Math.floor(diffMs / hour)) });
  if (diffMs < 7 * day) return t("presence.daysAgo", { count: Math.max(1, Math.floor(diffMs / day)) });
  return t("presence.offline");
}
