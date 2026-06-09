import { User } from "../types";
import { activeBugSquadBonuses } from "./bugSquadService";

export type ForegroundCatchBalance = {
  hitboxMultiplier: number;
  timeMultiplier: number;
};

export type BugSmashDuelBalance = {
  comboGraceMs: number;
  focusEasyHits: number;
  hitboxMultiplier: number;
  movementFinalBonusCap: number;
  questRewardRarityBoost: number;
  radarRarePointChance: number;
  targetSpacingMultiplier: number;
  xpDuplicatePointChance: number;
  speedMultiplier: number;
  streakMissForgiveness: number;
  supportBonusEvery: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function foregroundCatchBalanceForUser(user?: Pick<User, "activeBugSquad"> | null): ForegroundCatchBalance {
  const bonuses = activeBugSquadBonuses(user ?? undefined);
  return {
    hitboxMultiplier: 1.06 + clamp(bonuses.catch_assist, 0, 0.22),
    timeMultiplier: 1 + clamp(bonuses.catch_time, 0, 0.2)
  };
}

export function bugSmashDuelBalanceForUser(user?: Pick<User, "activeBugSquad"> | null): BugSmashDuelBalance {
  const bonuses = activeBugSquadBonuses(user ?? undefined);
  return {
    comboGraceMs: Math.round(650 + clamp(bonuses.knowledge_boost, 0, 0.15) * 5200),
    focusEasyHits: bonuses.focus_boost >= 0.045 ? 1 : 0,
    hitboxMultiplier: 1.05 + clamp(bonuses.catch_assist, 0, 0.22),
    movementFinalBonusCap: bonuses.movement_boost >= 0.045 ? 1 : 0,
    questRewardRarityBoost: clamp(bonuses.quest_boost * 0.35, 0, 0.05),
    radarRarePointChance: clamp(bonuses.radar_rarity * 1.2, 0, 0.08),
    targetSpacingMultiplier: 1 - clamp(bonuses.radar_spawn * 0.45, 0, 0.08),
    xpDuplicatePointChance: clamp(bonuses.xp_boost * 0.9, 0, 0.08),
    speedMultiplier: 1 + clamp(bonuses.catch_time, 0, 0.18),
    streakMissForgiveness: bonuses.streak_protection > 0 ? 1 : 0,
    supportBonusEvery: bonuses.support_boost >= 0.075 ? 4 : bonuses.support_boost >= 0.03 ? 6 : 0
  };
}
