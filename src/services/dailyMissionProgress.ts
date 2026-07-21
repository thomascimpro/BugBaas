import type { ArcadeMode, BugSmashDuel } from "../types";

export const dailyArcadeModes: ArcadeMode[] = ["tap_duel", "web_runner", "nest_defense", "bug_glide", "bug_tower", "bubble_swarm"];

export function completedDailyArcadeModes(userId: string, duels: BugSmashDuel[], date = new Date()): ArcadeMode[] {
  const day = localDayId(date);
  const completed = new Set<ArcadeMode>();
  duels.forEach((duel) => {
    if (duel.fromUserId !== userId && duel.toUserId !== userId) return;
    const submittedAt = duel.scores?.[userId]?.submittedAt ?? "";
    if (!submittedAt || localDayId(new Date(submittedAt)) !== day) return;
    const mode = duel.arcadeMode ?? "tap_duel";
    if (dailyArcadeModes.includes(mode)) completed.add(mode);
  });
  return dailyArcadeModes.filter((mode) => completed.has(mode));
}

function localDayId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
