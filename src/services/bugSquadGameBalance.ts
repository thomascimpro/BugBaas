import { User } from "../types";
import { activeBugSquadBonuses, activeBugSquadBonusList } from "./bugSquadService";

export type ForegroundCatchBalance = {
  hitboxMultiplier: number;
  timeMultiplier: number;
};

export type BugSmashDuelBalance = {
  comboBonusEvery: number;
  comboGraceMs: number;
  focusEasyHits: number;
  hitboxMultiplier: number;
  movementFinalBonusCap: number;
  questRewardRarityBoost: number;
  radarRarePointChance: number;
  targetSpacingMultiplier: number;
  xpDuplicatePointChance: number;
  speedMultiplier: number;
  supportBonusEvery: number;
};

export type ArcadeSquadAssistBalance = {
  activeCount: number;
  bugGlide: {
    extraHeart: number;
    liftAssist: number;
    pickupRadiusBonus: number;
    shieldBonusMs: number;
  };
  nestDefense: {
    damageMultiplier: number;
    extraCharges: number;
    fireRateMultiplier: number;
    rechargeMultiplier: number;
    slowMultiplier: number;
    startingHpBonus: number;
  };
  webRunner: {
    collisionWindowBonus: number;
    magnetBonusMs: number;
    startShield: boolean;
  };
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
    comboBonusEvery: comboBonusEveryForValue(bonuses.combo_boost),
    comboGraceMs: Math.round(650 + clamp(bonuses.knowledge_boost, 0, 0.15) * 5200),
    focusEasyHits: tieredCount(bonuses.focus_boost, [0.015, 0.045, 0.075], 3),
    hitboxMultiplier: 1.05 + clamp(bonuses.catch_assist, 0, 0.22),
    movementFinalBonusCap: tieredCount(bonuses.movement_boost, [0.015, 0.045, 0.075], 3),
    questRewardRarityBoost: clamp(bonuses.quest_boost * 0.35, 0, 0.05),
    radarRarePointChance: clamp(bonuses.radar_rarity * 1.2, 0, 0.08),
    targetSpacingMultiplier: 1 - clamp(bonuses.radar_spawn * 0.45, 0, 0.08),
    xpDuplicatePointChance: clamp(bonuses.xp_boost * 0.9, 0, 0.08),
    speedMultiplier: 1 + clamp(bonuses.catch_time, 0, 0.18),
    supportBonusEvery: supportBonusEveryForValue(bonuses.support_boost)
  };
}

export function arcadeSquadAssistForUser(user?: Pick<User, "activeBugSquad"> | null): ArcadeSquadAssistBalance {
  const bonuses = activeBugSquadBonuses(user ?? undefined);
  const activeCount = activeBugSquadBonusList(user ?? undefined).length;
  const supportValue = bonuses.support_boost + bonuses.knowledge_boost + bonuses.focus_boost + bonuses.quest_boost;
  const movementValue = bonuses.movement_boost + bonuses.catch_time;
  const controlValue = bonuses.catch_assist + bonuses.radar_spawn + bonuses.radar_rarity;

  return {
    activeCount,
    bugGlide: {
      extraHeart: activeCount >= 3 || bonuses.movement_boost >= 0.075 ? 1 : 0,
      liftAssist: clamp(movementValue * 0.9, 0, 0.16),
      pickupRadiusBonus: Math.round(clamp(controlValue * 42, 0, 5)),
      shieldBonusMs: Math.round(clamp(supportValue * 9000, 0, 1400))
    },
    nestDefense: {
      damageMultiplier: 1 + clamp((bonuses.combo_boost + bonuses.xp_boost + bonuses.focus_boost) * 0.55, 0, 0.1),
      extraCharges: tieredCount(supportValue, [0.045, 0.09], 2),
      fireRateMultiplier: 1 - clamp((bonuses.catch_time + bonuses.radar_spawn) * 0.45, 0, 0.08),
      rechargeMultiplier: 1 - clamp(supportValue * 0.65, 0, 0.12),
      slowMultiplier: 1 - clamp(controlValue * 0.75, 0, 0.16),
      startingHpBonus: tieredCount(bonuses.movement_boost + bonuses.support_boost, [0.045, 0.09], 2)
    },
    webRunner: {
      collisionWindowBonus: Math.round(clamp((bonuses.catch_assist + bonuses.catch_time) * 18, 0, 4)),
      magnetBonusMs: Math.round(clamp((bonuses.radar_spawn + bonuses.radar_rarity + bonuses.xp_boost) * 9000, 0, 1200)),
      startShield: activeCount >= 3 || bonuses.support_boost >= 0.075 || bonuses.movement_boost >= 0.075
    }
  };
}

function comboBonusEveryForValue(value: number): number {
  if (value >= 0.06) return 2;
  if (value >= 0.03) return 3;
  if (value >= 0.01) return 4;
  return 5;
}

function supportBonusEveryForValue(value: number): number {
  if (value >= 0.09) return 4;
  if (value >= 0.075) return 5;
  if (value >= 0.045) return 6;
  if (value >= 0.03) return 7;
  if (value >= 0.015) return 8;
  return 0;
}

function tieredCount(value: number, thresholds: number[], cap: number): number {
  return Math.min(cap, thresholds.filter((threshold) => value >= threshold).length);
}
