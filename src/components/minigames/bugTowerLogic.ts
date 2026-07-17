export const TOWER_MAX_CHARGE_MS = 720;

export type TowerDifficulty = {
  gapMax: number;
  gapMin: number;
  level: number;
  movingEvery: number;
  scrollSpeed: number;
  widthMax: number;
  widthMin: number;
};

export function towerDifficulty(floor: number, elapsedMs: number): TowerDifficulty {
  const level = Math.min(8, Math.floor(floor / 8) + Math.floor(elapsedMs / 45000));
  return {
    gapMax: clamp(11.2 + level * 0.36, 11.2, 14.1),
    gapMin: clamp(9.7 + level * 0.24, 9.7, 11.6),
    level,
    movingEvery: Math.max(3, 7 - Math.floor(level / 2)),
    scrollSpeed: floor < 4 ? 0 : clamp(0.018 + level * 0.008, 0.018, 0.082),
    widthMax: clamp(49 - level * 3.7, 18, 49),
    widthMin: clamp(39 - level * 3.4, 13, 39)
  };
}

export function towerPlatformWidth(floor: number, roll: number): number {
  const difficulty = towerDifficulty(floor, 0);
  return clamp(difficulty.widthMin + clamp(roll, 0, 1) * (difficulty.widthMax - difficulty.widthMin), 13, 49);
}

export function towerPlatformGap(floor: number, roll: number): number {
  const difficulty = towerDifficulty(floor, 0);
  return difficulty.gapMin + clamp(roll, 0, 1) * (difficulty.gapMax - difficulty.gapMin);
}

export function towerJumpVelocity(holdMs: number): number {
  const charge = clamp(holdMs / TOWER_MAX_CHARGE_MS, 0, 1);
  const eased = 1 - (1 - charge) ** 2;
  return -(1.86 + eased * 1.32);
}

export function towerDifficultyLabel(level: number): string {
  if (level <= 0) return "Warm-up";
  if (level <= 2) return "Slippery";
  if (level <= 4) return "Sharp";
  if (level <= 6) return "Brutal";
  return "Mythic";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
