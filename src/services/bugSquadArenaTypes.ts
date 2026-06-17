import { BugArtId } from "./bugArt";
import { BugDexRarity } from "./pointsService";

export type ArenaType = "Crash" | "Leak" | "Glitch" | "Security" | "Patch";
export type ArenaRole = "Tank" | "Striker" | "Support" | "Control" | "Speed" | "Boss" | "Balanced";
export type MoveKind = "basic" | "skill" | "ultimate";
export type StatusKind = "poison" | "burn" | "slow" | "stun" | "regen" | "dodge";

export type ArenaStats = {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  critRate: number;
};

export type ArenaMove = {
  id: string;
  name: string;
  description: string;
  kind: MoveKind;
  type: ArenaType;
  power: number;
  accuracy: number;
  cost: number;
  unlockLevel: number;
  effect?: Partial<Record<StatusKind | "shield" | "heal" | "attackUp" | "attackDown" | "recoil", number>>;
};

export type ArenaSpecies = {
  speciesId: string;
  displayName: string;
  sourceBugArtId: BugArtId;
  type: ArenaType;
  role: ArenaRole;
  rarity: BugDexRarity;
  baseStats: ArenaStats;
  moves: ArenaMove[];
  passive: string;
};

export type ArenaBug = ArenaSpecies & {
  instanceId: string;
  level: number;
  xp: number;
  unlocked: boolean;
  stats: ArenaStats;
};

export type BattleBug = ArenaBug & {
  currentHp: number;
  energy: number;
  shield: number;
  statuses: { kind: StatusKind; turns: number; value?: number }[];
  fainted: boolean;
  defending: boolean;
};

export type SquadSnapshot = {
  snapshotId: string;
  ownerPlayerId: string;
  ownerDisplayName: string;
  createdAt: string;
  teamPower: number;
  bugs: ArenaBug[];
  source: "local" | "mock" | "firestore";
};

export type BattleChoice = {
  side: "player" | "enemy";
  kind: "move" | "swap" | "defend";
  moveId?: string;
  swapToIndex?: number;
};

export type BattleStats = {
  damageDealt: number;
  damageTaken: number;
  maxCombo: number;
  combo: number;
  ultimatesUsed: number;
  swapsUsed: number;
  perfectCounters: number;
  superEffectiveHits: number;
  criticalHits: number;
  misses: number;
  defeatedEnemyBugs: number;
  ownBugsLost: number;
};

export type BattleState = {
  battleId: string;
  seed: string;
  turn: number;
  phase: "player_choice" | "resolving" | "result";
  playerSquad: BattleBug[];
  enemySquad: BattleBug[];
  playerActiveIndex: number;
  enemyActiveIndex: number;
  log: string[];
  playerChoicesLog: BattleChoice[];
  stats: BattleStats;
};

export type ArenaSave = {
  version: 1;
  playerId: string;
  coins: number;
  collection: ArenaBug[];
  activeSquadIds: string[];
  completedTutorial: boolean;
  battleHistory: ArenaResult[];
};

export type ArenaResult = {
  gameId: "bugsquad-arena";
  playerId: string;
  seed: string;
  opponentPlayerId: string;
  opponentDisplayName: string;
  won: boolean;
  score: number;
  targetScore: number;
  turnsUsed: number;
  bugsRemaining: number;
  damageDealt: number;
  damageTaken: number;
  xpGained: number;
  coinsGained: number;
  rank: "S" | "A" | "B" | "C" | "D";
  squadSnapshot: SquadSnapshot;
  enemySquadSnapshot: SquadSnapshot;
  playerChoicesLog: BattleChoice[];
  metadata: BattleStats & { finalHpPercent: number; teamPower: number; enemyTeamPower: number };
};
