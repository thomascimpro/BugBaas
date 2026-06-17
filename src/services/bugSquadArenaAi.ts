import { BattleChoice, BattleState } from "./bugSquadArenaTypes";
import { activeBug, calculateDamage, legalMoves, rngFromSeed } from "./bugSquadArenaBattleEngine";
import { getTypeMultiplier } from "./bugSquadArenaBalance";

export function chooseEnemyAction(state: BattleState): BattleChoice {
  const enemy = activeBug(state, "enemy");
  const player = activeBug(state, "player");
  const rng = rngFromSeed(`${state.seed}:ai:${state.turn}`);
  const moves = legalMoves(enemy);
  const livingSwap = state.enemySquad.findIndex((bug, index) => index !== state.enemyActiveIndex && !bug.fainted && getTypeMultiplier(player.type, bug.type) < 1);

  if (enemy.currentHp / enemy.stats.maxHp < 0.25) {
    const heal = moves.find((move) => move.effect?.heal || move.effect?.shield);
    if (heal) return { side: "enemy", kind: "move", moveId: heal.id };
    if (livingSwap >= 0 && rng() < 0.35) return { side: "enemy", kind: "swap", swapToIndex: livingSwap };
  }

  const koMove = moves.find((move) => move.power > 0 && calculateDamage(enemy, player, move, rng).damage >= player.currentHp);
  if (koMove) return { side: "enemy", kind: "move", moveId: koMove.id };

  const effective = moves.find((move) => move.power > 0 && getTypeMultiplier(move.type, player.type) > 1);
  if (effective) return { side: "enemy", kind: "move", moveId: effective.id };

  const best = moves.slice().sort((a, b) => b.power - a.power)[0];
  if (best) return { side: "enemy", kind: "move", moveId: best.id };
  return { side: "enemy", kind: "defend" };
}
