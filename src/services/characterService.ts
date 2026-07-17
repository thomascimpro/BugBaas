import { ImageSourcePropType } from "react-native";
import { User } from "../types";
import { bugDexSetById } from "./bugDexSetService";
import { badgeDefinitions } from "./pointsService";

export type CharacterId =
  | "rookie"
  | "debug-ranger"
  | "support-knight"
  | "code-wizard"
  | "field-engineer"
  | "radar-scout"
  | "lab-catcher"
  | "cyber-exterminator"
  | "knowledge-keeper"
  | "bug-fisher"
  | "golden-net-champion"
  | "legendary-swarm-hunter"
  | "beetle-brigadier"
  | "prism-wing-catcher"
  | "buzz-pilot"
  | "sting-sentinel"
  | "signal-pattern-scout"
  | "webshade-trapper"
  | "camo-hopper"
  | "aqua-skimmer"
  | "pantry-patrol"
  | "mythic-prism-monarch";

export type CharacterOption = {
  accent: string;
  id: CharacterId;
  label: string;
  unlockBadgeId?: string;
  unlockLabel?: string;
  unlockPoints: number;
  source: ImageSourcePropType;
};

export type CharacterUnlockContext = {
  allowUnknownSetBadges?: boolean;
  ownedBugDexIds?: Set<string>;
  unlockedBugDexIds?: Set<string>;
  user?: User;
};

export const defaultCharacterId: CharacterId = "rookie";

export const characterOptions: CharacterOption[] = [
  { accent: "#f0a23a", id: "rookie", label: "Rookie Bug Catcher", unlockPoints: 0, source: require("../../assets/characters/character-rookie-bug-catcher.png") },
  { accent: "#5f8f4f", id: "debug-ranger", label: "Debug Ranger", unlockPoints: 25, source: require("../../assets/characters/character-debug-ranger.png") },
  { accent: "#67aee8", id: "support-knight", label: "Support Knight", unlockPoints: 75, source: require("../../assets/characters/character-support-knight.png") },
  { accent: "#a85cff", id: "code-wizard", label: "Code Wizard", unlockPoints: 150, source: require("../../assets/characters/character-code-wizard.png") },
  { accent: "#2d9cc7", id: "field-engineer", label: "Field Engineer", unlockPoints: 300, source: require("../../assets/characters/character-field-engineer.png") },
  { accent: "#41c878", id: "radar-scout", label: "Radar Scout", unlockPoints: 500, source: require("../../assets/characters/character-radar-scout.png") },
  { accent: "#b887d8", id: "lab-catcher", label: "Lab Catcher", unlockPoints: 0, source: require("../../assets/characters/character-lab-catcher.png") },
  { accent: "#9c4cff", id: "cyber-exterminator", label: "Cyber Exterminator", unlockPoints: 1350, source: require("../../assets/characters/character-cyber-exterminator.png") },
  { accent: "#c28c4b", id: "knowledge-keeper", label: "Knowledge Keeper", unlockPoints: 1800, source: require("../../assets/characters/character-knowledge-keeper.png") },
  { accent: "#d6aa55", id: "bug-fisher", label: "Bug Fisher", unlockPoints: 2400, source: require("../../assets/characters/character-bug-fisher.png") },
  { accent: "#e8b72f", id: "golden-net-champion", label: "Golden Net Champion", unlockPoints: 3200, source: require("../../assets/characters/character-golden-net-champion.png") },
  { accent: "#63b7d7", id: "legendary-swarm-hunter", label: "Legendary Swarm Hunter", unlockPoints: 4500, source: require("../../assets/characters/character-legendary-swarm-hunter.png") },
  { accent: "#5aa342", id: "beetle-brigadier", label: "Beetle Brigadier", unlockBadgeId: "bugdex-set-beetle-brigade", unlockLabel: "Keverbende badge", unlockPoints: 0, source: require("../../assets/characters/character-beetle-brigadier.png") },
  { accent: "#8c62d9", id: "prism-wing-catcher", label: "Prism Wing Catcher", unlockBadgeId: "bugdex-set-wings-of-color", unlockLabel: "Vlinders & motten badge", unlockPoints: 0, source: require("../../assets/characters/character-prism-wing-catcher.png") },
  { accent: "#f0c13d", id: "buzz-pilot", label: "Buzz Pilot", unlockBadgeId: "bugdex-set-buzz-squad", unlockLabel: "Vliegers & muggen badge", unlockPoints: 0, source: require("../../assets/characters/character-buzz-pilot.png") },
  { accent: "#e0b22d", id: "sting-sentinel", label: "Sting Sentinel", unlockBadgeId: "bugdex-set-sting-team", unlockLabel: "Steekteam badge", unlockPoints: 0, source: require("../../assets/characters/character-sting-sentinel.png") },
  { accent: "#d94d32", id: "signal-pattern-scout", label: "Signal Pattern Scout", unlockBadgeId: "bugdex-set-pattern-warnings", unlockLabel: "Wantsen & cicades badge", unlockPoints: 0, source: require("../../assets/characters/character-signal-pattern-scout.png") },
  { accent: "#5c477c", id: "webshade-trapper", label: "Webshade Trapper", unlockBadgeId: "bugdex-set-web-and-sting", unlockLabel: "Web & angel badge", unlockPoints: 0, source: require("../../assets/characters/character-webshade-trapper.png") },
  { accent: "#67b942", id: "camo-hopper", label: "Camo Hopper", unlockBadgeId: "bugdex-set-jump-and-hide", unlockLabel: "Springers & camo badge", unlockPoints: 0, source: require("../../assets/characters/character-camo-hopper.png") },
  { accent: "#2eb7cf", id: "aqua-skimmer", label: "Aqua Skimmer", unlockBadgeId: "bugdex-set-water-hunters", unlockLabel: "Waterjagers badge", unlockPoints: 0, source: require("../../assets/characters/character-aqua-skimmer.png") },
  { accent: "#c4a56a", id: "pantry-patrol", label: "Pantry Patrol", unlockBadgeId: "bugdex-set-house-raiders", unlockLabel: "Huisplaagjes badge", unlockPoints: 0, source: require("../../assets/characters/character-pantry-patrol.png") },
  { accent: "#9c5cff", id: "mythic-prism-monarch", label: "Mythic Prism Monarch", unlockBadgeId: "bugdex-set-mythic-showcase", unlockLabel: "Mythische vondsten badge", unlockPoints: 0, source: require("../../assets/characters/character-mythic-prism-monarch.png") }
];

const legacyCharacterIds: Record<string, CharacterId> = {
  blue: "debug-ranger",
  classic: "rookie",
  forest: "lab-catcher",
  gold: "radar-scout",
  lime: "field-engineer",
  midnight: "legendary-swarm-hunter",
  neon: "cyber-exterminator",
  orange: "golden-net-champion",
  purple: "code-wizard",
  rain: "bug-fisher",
  red: "support-knight",
  safari: "knowledge-keeper"
};

export function safeCharacterId(characterId?: string): CharacterId {
  const migratedId = characterId ? legacyCharacterIds[characterId] ?? characterId : undefined;
  return characterOptions.some((item) => item.id === migratedId) ? migratedId as CharacterId : defaultCharacterId;
}

export function characterOptionById(characterId?: string): CharacterOption {
  return characterOptions.find((item) => item.id === safeCharacterId(characterId)) ?? characterOptions[0];
}

export function isCharacterUnlocked(characterId: CharacterId, totalPoints: number, context: CharacterUnlockContext = {}): boolean {
  const option = characterOptionById(characterId);
  if (!option.unlockBadgeId) return totalPoints >= option.unlockPoints;
  return isCharacterBadgeUnlocked(option.unlockBadgeId, context);
}

export function bestUnlockedCharacterId(totalPoints: number, context: CharacterUnlockContext = {}): CharacterId {
  return [...characterOptions]
    .reverse()
    .find((item) => isCharacterUnlocked(item.id, totalPoints, context))?.id ?? defaultCharacterId;
}

function isCharacterBadgeUnlocked(badgeId: string, context: CharacterUnlockContext): boolean {
  const badge = badgeDefinitions.find((item) => item.id === badgeId);
  if (!badge) return false;
  if (badge.bugDexSetId) {
    const set = bugDexSetById(badge.bugDexSetId);
    if (!set) return false;
    const unlockedBugDexIds = context.unlockedBugDexIds ?? context.ownedBugDexIds;
    if (!unlockedBugDexIds) return context.allowUnknownSetBadges === true;
    return set.bugIds.every((bugId) => unlockedBugDexIds.has(bugId));
  }
  const user = context.user;
  if (!user) return false;
  return (badge.minBugReports === undefined || user.bugCount >= badge.minBugReports) &&
    (badge.minBugDexCaught === undefined || (user.bugDexCount ?? 0) >= badge.minBugDexCaught) &&
    (badge.minComments === undefined || (user.commentPointCount ?? 0) >= badge.minComments) &&
    (badge.minLegendaryBugDex === undefined || (user.legendaryBugDexCount ?? 0) >= badge.minLegendaryBugDex) &&
    (badge.minMovementKm === undefined || (user.movementKmTotal ?? 0) >= badge.minMovementKm) &&
    (badge.minMythicBugDex === undefined || (user.mythicBugDexCount ?? 0) >= badge.minMythicBugDex) &&
    (badge.minPoints === undefined || user.totalPoints >= badge.minPoints) &&
    (badge.minSplats === undefined || (user.splatCount ?? 0) >= badge.minSplats) &&
    (badge.minTradedBugDex === undefined || (user.tradedBugDexCount ?? 0) >= badge.minTradedBugDex) &&
    (badge.minUpgradedBugDex === undefined || (user.upgradedBugDexCount ?? 0) >= badge.minUpgradedBugDex) &&
    (badge.minUpvotesGiven === undefined || (user.upvoteGivenPointCount ?? 0) >= badge.minUpvotesGiven);
}
