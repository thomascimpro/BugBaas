import { ImageSourcePropType } from "react-native";

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
  | "legendary-swarm-hunter";

export type CharacterOption = {
  accent: string;
  id: CharacterId;
  label: string;
  unlockPoints: number;
  source: ImageSourcePropType;
};

export const defaultCharacterId: CharacterId = "rookie";

export const characterOptions: CharacterOption[] = [
  { accent: "#f0a23a", id: "rookie", label: "Rookie Bug Catcher", unlockPoints: 0, source: require("../../assets/characters/character-rookie-bug-catcher.png") },
  { accent: "#5f8f4f", id: "debug-ranger", label: "Debug Ranger", unlockPoints: 25, source: require("../../assets/characters/character-debug-ranger.png") },
  { accent: "#67aee8", id: "support-knight", label: "Support Knight", unlockPoints: 75, source: require("../../assets/characters/character-support-knight.png") },
  { accent: "#a85cff", id: "code-wizard", label: "Code Wizard", unlockPoints: 150, source: require("../../assets/characters/character-code-wizard.png") },
  { accent: "#2d9cc7", id: "field-engineer", label: "Field Engineer", unlockPoints: 300, source: require("../../assets/characters/character-field-engineer.png") },
  { accent: "#41c878", id: "radar-scout", label: "Radar Scout", unlockPoints: 500, source: require("../../assets/characters/character-radar-scout.png") },
  { accent: "#b887d8", id: "lab-catcher", label: "Lab Catcher", unlockPoints: 850, source: require("../../assets/characters/character-lab-catcher.png") },
  { accent: "#9c4cff", id: "cyber-exterminator", label: "Cyber Exterminator", unlockPoints: 1350, source: require("../../assets/characters/character-cyber-exterminator.png") },
  { accent: "#c28c4b", id: "knowledge-keeper", label: "Knowledge Keeper", unlockPoints: 1800, source: require("../../assets/characters/character-knowledge-keeper.png") },
  { accent: "#d6aa55", id: "bug-fisher", label: "Bug Fisher", unlockPoints: 2400, source: require("../../assets/characters/character-bug-fisher.png") },
  { accent: "#e8b72f", id: "golden-net-champion", label: "Golden Net Champion", unlockPoints: 3200, source: require("../../assets/characters/character-golden-net-champion.png") },
  { accent: "#63b7d7", id: "legendary-swarm-hunter", label: "Legendary Swarm Hunter", unlockPoints: 4500, source: require("../../assets/characters/character-legendary-swarm-hunter.png") }
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

export function isCharacterUnlocked(characterId: CharacterId, totalPoints: number): boolean {
  return totalPoints >= characterOptionById(characterId).unlockPoints;
}

export function bestUnlockedCharacterId(totalPoints: number): CharacterId {
  return [...characterOptions]
    .reverse()
    .find((item) => totalPoints >= item.unlockPoints)?.id ?? defaultCharacterId;
}
