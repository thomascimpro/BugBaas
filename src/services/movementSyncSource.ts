export type MovementSyncSource = "health_connect" | "fitness_syncer";

export function canRegisterMovementSource(source: MovementSyncSource, fitnessSyncerConnected: boolean): boolean {
  return source === (fitnessSyncerConnected ? "fitness_syncer" : "health_connect");
}
