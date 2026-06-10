import { bugSmashDuelBugCount } from "./bugSmashDuelService";
import { bugDexEntries, BugDexRarity } from "./pointsService";

export type SoloCampaignConfig = {
  boss: boolean;
  level: number;
  pcScore: number;
  targetScore: number;
  wave: number;
};

export const soloCampaignMaxLevel = 5;
export const soloCampaignWavesPerLevel = 4;
export const soloCampaignMaxWave = soloCampaignMaxLevel * soloCampaignWavesPerLevel;

const soloCampaignTargetsByLevel = [
  [60, 68, 76, 90],
  [78, 88, 98, 116],
  [96, 108, 120, 142],
  [116, 130, 144, 170],
  [138, 154, 170, 200]
];

export function soloCampaignConfig(wave: number): SoloCampaignConfig {
  const safeWave = Math.max(1, Math.min(soloCampaignMaxWave, Math.floor(wave)));
  const level = Math.floor((safeWave - 1) / soloCampaignWavesPerLevel) + 1;
  const waveInLevel = ((safeWave - 1) % soloCampaignWavesPerLevel) + 1;
  const boss = waveInLevel === soloCampaignWavesPerLevel;
  const targetScore = soloCampaignTargetsByLevel[level - 1]?.[waveInLevel - 1] ?? 60;
  const pcScore = Math.max(45, targetScore - (boss ? 4 : 8));
  return { boss, level, pcScore, targetScore, wave: safeWave };
}

export function soloCampaignBugIds(seed: number, config: SoloCampaignConfig) {
  const waveInLevel = ((config.wave - 1) % soloCampaignWavesPerLevel) + 1;
  const maxRank = config.boss ? Math.min(4, 2 + config.level) : Math.min(3, 1 + Math.ceil((config.level + waveInLevel) / 2));
  const ranked = bugDexEntries
    .filter((entry) => bugDexRarityRank(entry.rarity) <= maxRank)
    .map((entry, index) => ({ id: entry.id, sort: stableHash(`${seed}:solo:${config.wave}:${entry.id}:${index}`) }))
    .sort((a, b) => a.sort - b.sort);
  const bossLead = config.boss
    ? bugDexEntries
        .filter((entry) => bugDexRarityRank(entry.rarity) >= Math.min(3, config.level + 1))
        .map((entry, index) => ({ id: entry.id, sort: stableHash(`${seed}:boss:${config.wave}:${entry.id}:${index}`) }))
        .sort((a, b) => a.sort - b.sort)
        .map((item) => item.id)[0]
    : "";
  const ids = bossLead ? [bossLead, ...ranked.filter((item) => item.id !== bossLead).map((item) => item.id)] : ranked.map((item) => item.id);
  const fallback = bugDexEntries
    .map((entry, index) => ({ id: entry.id, sort: stableHash(`${seed}:fallback:${entry.id}:${index}`) }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.id);
  return [...ids, ...fallback.filter((id) => !ids.includes(id))].slice(0, bugSmashDuelBugCount);
}

export function bugDexRarityRank(rarity: BugDexRarity) {
  if (rarity === "Mythisch") return 4;
  if (rarity === "Legendarisch") return 3;
  if (rarity === "Episch") return 2;
  if (rarity === "Zeldzaam") return 1;
  return 0;
}

function stableHash(seed: string) {
  return seed.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) >>> 0, 0);
}
