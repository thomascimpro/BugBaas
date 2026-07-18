export const TOWER_MAX_CHARGE_MS = 720;
export const TOWER_GRAVITY = 0.13;

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
  const safeFloor = Math.max(0, floor);
  const heightProgress = clamp(safeFloor / 240, 0, 1);
  const timeProgress = clamp((elapsedMs - 10000) / 125000, 0, 1);
  const level = Math.min(8, Math.floor(safeFloor / 50) + Math.floor(timeProgress * 2));
  const movingEvery = safeFloor < 30 ? 999 : Math.max(3, 10 - Math.floor(safeFloor / 45));
  return {
    gapMax: 11.5 + heightProgress * 5.8,
    gapMin: 9.6 + heightProgress * 4.8,
    level,
    movingEvery,
    scrollSpeed: safeFloor < 3 && elapsedMs < 8000
      ? 0
      : clamp(0.011 + safeFloor * 0.000055 + timeProgress * 0.055, 0.011, 0.09),
    widthMax: 67 - heightProgress * 35,
    widthMin: 56 - heightProgress * 30
  };
}

export function towerPlatformWidth(floor: number, roll: number): number {
  const difficulty = towerDifficulty(floor, 0);
  return clamp(difficulty.widthMin + clamp(roll, 0, 1) * (difficulty.widthMax - difficulty.widthMin), 27, 67);
}

export function towerPlatformGap(floor: number, roll: number): number {
  const difficulty = towerDifficulty(floor, 0);
  return difficulty.gapMin + clamp(roll, 0, 1) * (difficulty.gapMax - difficulty.gapMin);
}

export function towerHorizontalOffset(floor: number, roll: number): number {
  const difficulty = towerDifficulty(floor, 0);
  const direction = floor % 2 === 0 ? -1 : 1;
  const reach = 13 + clamp(roll, 0, 1) * Math.min(23, 14 + difficulty.level * 1.25);
  return direction * reach;
}

export function towerJumpVelocity(holdMs: number): number {
  const charge = clamp(holdMs / TOWER_MAX_CHARGE_MS, 0, 1);
  const power = charge ** 1.45;
  return -(1.77 + power * 2.28);
}

export function towerDifficultyLabel(level: number): string {
  if (level <= 0) return "Warm-up";
  if (level <= 2) return "Slippery";
  if (level <= 4) return "Sharp";
  if (level <= 6) return "Brutal";
  return "Mythic";
}

export function towerZoneIndex(floor: number): number {
  return Math.floor(Math.max(0, floor) / 100) % 5;
}

export function towerZoneName(floor: number): string {
  const names = ["Ice Citadel", "Hive Jungle", "Ember Forge", "Sky Temple", "Cosmic Void"];
  const zone = Math.floor(Math.max(0, floor) / 100);
  const remix = Math.floor(zone / names.length);
  return `${names[zone % names.length]}${remix ? ` R${remix}` : ""}`;
}

export function towerHeightScore(floor: number, maxCombo: number): number {
  return Math.min(50000, Math.max(0, Math.floor(floor) * 100 + Math.max(0, Math.floor(maxCombo)) * 150));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
