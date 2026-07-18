export type BubbleCell = { col: number; id: string; kind: string; row: number };

export const BUBBLE_COLUMNS = 9;
export const BUBBLE_DANGER_ROW = 11;

export type BubblePoint = { x: number; y: number };

export function bubbleCellKey(cell: Pick<BubbleCell, "col" | "row">): string {
  return `${cell.row}:${cell.col}`;
}

export function bubbleNeighborCells(row: number, col: number): Array<{ col: number; row: number }> {
  const diagonal = row % 2 ? 1 : -1;
  return [
    { row, col: col - 1 }, { row, col: col + 1 },
    { row: row - 1, col }, { row: row + 1, col },
    { row: row - 1, col: col + diagonal }, { row: row + 1, col: col + diagonal }
  ];
}

export function bubbleConnectedCluster<T extends BubbleCell>(board: T[], start: T): T[] {
  const byCell = new Map(board.map((bubble) => [bubbleCellKey(bubble), bubble]));
  const visited = new Set<string>();
  const queue = [start];
  const found: T[] = [];
  while (queue.length) {
    const bubble = queue.shift()!;
    if (visited.has(bubble.id) || bubble.kind !== start.kind) continue;
    visited.add(bubble.id);
    found.push(bubble);
    for (const cell of bubbleNeighborCells(bubble.row, bubble.col)) {
      const neighbor = byCell.get(bubbleCellKey(cell));
      if (neighbor && !visited.has(neighbor.id)) queue.push(neighbor);
    }
  }
  return found;
}

export function bubbleSupportedIds<T extends BubbleCell>(board: T[]): Set<string> {
  const byCell = new Map(board.map((bubble) => [bubbleCellKey(bubble), bubble]));
  const supported = new Set<string>();
  const queue = board.filter((bubble) => bubble.row === 0);
  while (queue.length) {
    const bubble = queue.shift()!;
    if (supported.has(bubble.id)) continue;
    supported.add(bubble.id);
    for (const cell of bubbleNeighborCells(bubble.row, bubble.col)) {
      const neighbor = byCell.get(bubbleCellKey(cell));
      if (neighbor && !supported.has(neighbor.id)) queue.push(neighbor);
    }
  }
  return supported;
}

export function resolveBubbleMatch<T extends BubbleCell>(board: T[], placed: T, minimumMatch = 3) {
  const cluster = bubbleConnectedCluster(board, placed);
  if (cluster.length < minimumMatch) return { board, dropped: 0, popped: 0 };
  const matchedIds = new Set(cluster.map((bubble) => bubble.id));
  const afterPop = board.filter((bubble) => !matchedIds.has(bubble.id));
  const supported = bubbleSupportedIds(afterPop);
  const nextBoard = afterPop.filter((bubble) => supported.has(bubble.id));
  return { board: nextBoard, dropped: afterPop.length - nextBoard.length, popped: cluster.length };
}

export function bubbleAvailableKinds<T extends Pick<BubbleCell, "kind">>(board: T[]): string[] {
  return [...new Set(board.map((bubble) => bubble.kind))];
}

export function bubbleAimPath(from: BubblePoint, aim: BubblePoint, targetY = 5): BubblePoint[] {
  const dy = Math.min(-4, aim.y - from.y);
  const dx = aim.x - from.x;
  const slopeX = dx / -dy;
  const projectedX = from.x + slopeX * (from.y - targetY);
  if (projectedX >= 5 && projectedX <= 95) return [from, { x: projectedX, y: targetY }];

  const wallX = projectedX < 5 ? 5 : 95;
  const wallY = from.y - Math.abs((wallX - from.x) / Math.max(0.001, Math.abs(slopeX)));
  const remainingY = Math.max(0, wallY - targetY);
  const reflectedX = wallX - Math.sign(slopeX) * Math.abs(slopeX) * remainingY;
  return [from, { x: wallX, y: wallY }, { x: clamp(reflectedX, 5, 95), y: targetY }];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
