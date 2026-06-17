import { ArenaBug, ArenaMove, BattleBug, BattleChoice, BattleState, SquadSnapshot } from "./bugSquadArenaTypes";
import { getTeamPower, getTypeMultiplier } from "./bugSquadArenaBalance";

export function rngFromSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function createBattleState(seed: string, player: SquadSnapshot, enemy: SquadSnapshot): BattleState {
  return { battleId: `arena-${seed}-${Date.now()}`, seed, turn: 1, phase: "player_choice", playerSquad: player.bugs.map(toBattleBug), enemySquad: enemy.bugs.map(toBattleBug), playerActiveIndex: 0, enemyActiveIndex: 0, log: ["Battle started."], playerChoicesLog: [], stats: emptyStats() };
}

export function toBattleBug(bug: ArenaBug): BattleBug {
  return { ...bug, currentHp: bug.stats.maxHp, energy: 1, shield: bug.speciesId === "waterkever-cachecrab" ? 20 : 0, statuses: [], fainted: false, defending: false };
}

export function legalMoves(bug: BattleBug) {
  return bug.moves.filter((move) => bug.level >= move.unlockLevel && bug.energy >= move.cost);
}

export function resolveTurn(state: BattleState, playerChoice: BattleChoice, enemyChoice: BattleChoice): BattleState {
  const rng = rngFromSeed(`${state.seed}:${state.turn}:${state.playerChoicesLog.length}`);
  let next = cloneState(state);
  next.phase = "resolving";
  next.playerChoicesLog.push(playerChoice);
  const first = orderChoices(next, playerChoice, enemyChoice);
  for (const choice of first) {
    if (battleWinner(next)) break;
    next = applyChoice(next, choice, rng);
    autoAdvance(next, "player");
    autoAdvance(next, "enemy");
  }
  applyStatusTicks(next, "player");
  applyStatusTicks(next, "enemy");
  const winner = battleWinner(next);
  next.phase = winner ? "result" : "player_choice";
  if (!winner) next.turn += 1;
  if (next.turn > 25 && !winner) next.phase = "result";
  return next;
}

export function battleWinner(state: BattleState): "player" | "enemy" | null {
  if (state.enemySquad.every((bug) => bug.fainted)) return "player";
  if (state.playerSquad.every((bug) => bug.fainted)) return "enemy";
  return null;
}

export function activeBug(state: BattleState, side: "player" | "enemy") {
  return side === "player" ? state.playerSquad[state.playerActiveIndex] : state.enemySquad[state.enemyActiveIndex];
}

function applyChoice(state: BattleState, choice: BattleChoice, rng: () => number) {
  const actor = activeBug(state, choice.side);
  if (!actor || actor.fainted) return state;
  if (choice.kind === "swap" && choice.swapToIndex !== undefined) return swapBug(state, choice.side, choice.swapToIndex);
  if (choice.kind === "defend") { actor.defending = true; actor.energy = Math.min(4, actor.energy + 1); actor.shield += 8; state.log.unshift(`${actor.displayName} verdedigt.`); return state; }
  const move = actor.moves.find((item) => item.id === choice.moveId) ?? legalMoves(actor)[0];
  if (!move) return state;
  return applyMove(state, choice.side, move, rng);
}

function applyMove(state: BattleState, side: "player" | "enemy", move: ArenaMove, rng: () => number) {
  const actor = activeBug(state, side);
  const defender = activeBug(state, side === "player" ? "enemy" : "player");
  actor.energy = Math.max(0, actor.energy - move.cost);
  if (move.kind === "basic") actor.energy = Math.min(4, actor.energy + 1);
  if (move.kind === "ultimate") state.stats.ultimatesUsed += side === "player" ? 1 : 0;
  if (rng() * 100 > move.accuracy) { state.stats.misses += side === "player" ? 1 : 0; state.log.unshift(`${actor.displayName} mist ${move.name}.`); return state; }
  const effect = move.effect ?? {};
  if (effect.heal) heal(actor, Number(effect.heal));
  if (effect.shield) actor.shield += Number(effect.shield);
  if (effect.dodge) actor.statuses.push({ kind: "dodge", turns: 1 });
  if (move.power > 0 && defender) {
    const dodge = defender.statuses.find((status) => status.kind === "dodge");
    if (dodge) { defender.statuses = defender.statuses.filter((status) => status !== dodge); state.log.unshift(`${defender.displayName} dodget.`); return state; }
    const result = calculateDamage(actor, defender, move, rng);
    let damage = result.damage;
    if (defender.shield > 0) { const blocked = Math.min(defender.shield, damage); defender.shield -= blocked; damage -= blocked; }
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    if (side === "player") { state.stats.damageDealt += damage; state.stats.combo += 1; state.stats.maxCombo = Math.max(state.stats.maxCombo, state.stats.combo); if (result.typeMultiplier > 1) state.stats.superEffectiveHits += 1; if (result.crit) state.stats.criticalHits += 1; } else { state.stats.damageTaken += damage; state.stats.combo = 0; }
    state.log.unshift(`${actor.displayName} gebruikt ${move.name}: ${damage} schade${result.typeMultiplier > 1 ? " effectief" : ""}.`);
    if (defender.currentHp <= 0) { defender.fainted = true; state.log.unshift(`${defender.displayName} is verslagen.`); if (side === "player") state.stats.defeatedEnemyBugs += 1; else state.stats.ownBugsLost += 1; }
  }
  if (effect.poison && defender) addStatus(defender, "poison", Number(effect.poison));
  if (effect.burn && defender) addStatus(defender, "burn", Number(effect.burn));
  if (effect.slow && defender) addStatus(defender, "slow", Number(effect.slow));
  if (effect.stun && defender && rng() * 100 < Number(effect.stun)) addStatus(defender, "stun", 1);
  if (effect.recoil) actor.currentHp = Math.max(1, actor.currentHp - Number(effect.recoil));
  return state;
}

export function calculateDamage(attacker: BattleBug, defender: BattleBug, move: ArenaMove, rng: () => number) {
  const typeMultiplier = getTypeMultiplier(move.type, defender.type);
  const variance = 0.92 + rng() * 0.16;
  const crit = rng() * 100 < attacker.stats.critRate;
  const defend = defender.defending ? 0.5 : 1;
  const raw = move.power * (attacker.stats.attack / Math.max(1, defender.stats.defense));
  return { damage: Math.max(1, Math.round(raw * typeMultiplier * variance * (crit ? 1.6 : 1) * defend)), typeMultiplier, crit };
}

function applyStatusTicks(state: BattleState, side: "player" | "enemy") {
  const bug = activeBug(state, side);
  if (!bug || bug.fainted) return;
  for (const status of bug.statuses) {
    if (status.kind === "poison") bug.currentHp = Math.max(0, bug.currentHp - Math.ceil(bug.stats.maxHp * 0.05));
    if (status.kind === "burn") bug.currentHp = Math.max(0, bug.currentHp - Math.ceil(bug.stats.maxHp * 0.03));
    if (status.kind === "regen") heal(bug, Math.ceil(bug.stats.maxHp * 0.05));
    status.turns -= 1;
  }
  bug.statuses = bug.statuses.filter((status) => status.turns > 0);
  bug.defending = false;
  if (bug.currentHp <= 0) bug.fainted = true;
}

function addStatus(bug: BattleBug, kind: BattleBug["statuses"][number]["kind"], turns: number) { if (!bug.statuses.some((status) => status.kind === kind)) bug.statuses.push({ kind, turns }); }
function heal(bug: BattleBug, amount: number) { bug.currentHp = Math.min(bug.stats.maxHp, bug.currentHp + amount); }
function swapBug(state: BattleState, side: "player" | "enemy", index: number) { const squad = side === "player" ? state.playerSquad : state.enemySquad; if (!squad[index] || squad[index].fainted) return state; if (side === "player") { state.playerActiveIndex = index; state.stats.swapsUsed += 1; } else state.enemyActiveIndex = index; state.log.unshift(`${squad[index].displayName} komt erin.`); return state; }
function autoAdvance(state: BattleState, side: "player" | "enemy") { const squad = side === "player" ? state.playerSquad : state.enemySquad; const activeIndex = side === "player" ? state.playerActiveIndex : state.enemyActiveIndex; if (!squad[activeIndex]?.fainted) return; const nextIndex = squad.findIndex((bug) => !bug.fainted); if (nextIndex >= 0) { if (side === "player") state.playerActiveIndex = nextIndex; else state.enemyActiveIndex = nextIndex; } }
function orderChoices(state: BattleState, playerChoice: BattleChoice, enemyChoice: BattleChoice) { const p = activeBug(state, "player"); const e = activeBug(state, "enemy"); if (playerChoice.kind === "swap") return [playerChoice, enemyChoice]; if (enemyChoice.kind === "swap") return [enemyChoice, playerChoice]; return (p.stats.speed >= e.stats.speed) ? [playerChoice, enemyChoice] : [enemyChoice, playerChoice]; }
function cloneState(state: BattleState): BattleState { return JSON.parse(JSON.stringify(state)); }
function emptyStats() { return { damageDealt: 0, damageTaken: 0, maxCombo: 0, combo: 0, ultimatesUsed: 0, swapsUsed: 0, perfectCounters: 0, superEffectiveHits: 0, criticalHits: 0, misses: 0, defeatedEnemyBugs: 0, ownBugsLost: 0 }; }
export function remainingHpPercent(bugs: BattleBug[]) { const hp = bugs.reduce((sum, bug) => sum + Math.max(0, bug.currentHp), 0); const max = bugs.reduce((sum, bug) => sum + bug.stats.maxHp, 0); return max ? hp / max : 0; }
export function createSnapshot(ownerPlayerId: string, ownerDisplayName: string, bugs: ArenaBug[], source: SquadSnapshot["source"] = "local"): SquadSnapshot { return { snapshotId: `${ownerPlayerId}-${Date.now()}`, ownerPlayerId, ownerDisplayName, createdAt: new Date().toISOString(), teamPower: getTeamPower(bugs), bugs: JSON.parse(JSON.stringify(bugs)), source }; }
