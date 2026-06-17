import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArenaBug, ArenaResult, ArenaSave, SquadSnapshot } from "./bugSquadArenaTypes";
import { createArenaBug, defaultActiveSquadSpeciesIds, getTeamPower, mockEnemySnapshots, starterSpeciesIds } from "./bugSquadArenaBalance";
import { createSnapshot } from "./bugSquadArenaBattleEngine";

const saveKey = "bugSquadArena:save:v1";

export async function loadArenaSave(playerId: string): Promise<ArenaSave> {
  const raw = await AsyncStorage.getItem(saveKey);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ArenaSave;
      if (parsed.version === 1 && parsed.collection?.length) return parsed;
    } catch {
      // ignore invalid arena save only
    }
  }
  const save = createDefaultSave(playerId);
  await saveArenaSave(save);
  return save;
}

export async function saveArenaSave(save: ArenaSave) {
  await AsyncStorage.setItem(saveKey, JSON.stringify(save));
}

export async function resetArenaSave(playerId: string) {
  const save = createDefaultSave(playerId);
  await saveArenaSave(save);
  return save;
}

export function createDefaultSave(playerId: string): ArenaSave {
  const collection = starterSpeciesIds.map((id) => createArenaBug(id, 1, true));
  const activeSquadIds = defaultActiveSquadSpeciesIds.map((speciesId) => collection.find((bug) => bug.speciesId === speciesId)?.instanceId).filter(Boolean) as string[];
  return { version: 1, playerId, coins: 0, collection, activeSquadIds, completedTutorial: false, battleHistory: [] };
}

export function activeSquad(save: ArenaSave): ArenaBug[] {
  return save.activeSquadIds.map((id) => save.collection.find((bug) => bug.instanceId === id)).filter((bug): bug is ArenaBug => Boolean(bug)).slice(0, 3);
}

export function updateActiveSquad(save: ArenaSave, ids: string[]): ArenaSave {
  const clean: string[] = [];
  for (const id of ids) {
    if (clean.length >= 3) break;
    if (clean.includes(id)) continue;
    if (save.collection.some((bug) => bug.instanceId === id && bug.unlocked)) clean.push(id);
  }
  return { ...save, activeSquadIds: clean };
}

export function createLocalSquadSnapshot(save: ArenaSave, displayName: string): SquadSnapshot {
  const bugs = activeSquad(save);
  return createSnapshot(save.playerId, displayName, bugs, "local");
}

export function listArenaOpponents(): SquadSnapshot[] {
  return mockEnemySnapshots();
}

export function applyBattleRewards(save: ArenaSave, result: ArenaResult): ArenaSave {
  const squadIds = new Set(result.squadSnapshot.bugs.map((bug) => bug.instanceId));
  const collection = save.collection.map((bug) => squadIds.has(bug.instanceId) ? applyXp(bug, result.xpGained) : bug);
  return { ...save, coins: save.coins + result.coinsGained, collection, battleHistory: [result, ...save.battleHistory].slice(0, 20) };
}

function applyXp(bug: ArenaBug, xp: number): ArenaBug {
  const nextXp = bug.xp + xp;
  const thresholds = [0, 0, 100, 240, 430, 680, 1000, 1400, 1900, 2500, 3300];
  let level = bug.level;
  while (level < 10 && nextXp >= thresholds[level + 1]) level += 1;
  if (level === bug.level) return { ...bug, xp: nextXp };
  const grown = createArenaBug(bug.speciesId, level, bug.unlocked);
  return { ...grown, instanceId: bug.instanceId, xp: nextXp };
}

export function teamPowerForSave(save: ArenaSave) {
  return getTeamPower(activeSquad(save));
}
