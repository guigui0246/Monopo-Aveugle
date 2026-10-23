import { DIRECTIONS, type Direction, type Tile } from './types';
export const VECTORS: Record<Direction, [number, number]> = {
  N: [0, -1],
  NE: [1, -1],
  E: [1, 0],
  SE: [1, 1],
  S: [0, 1],
  SW: [-1, 1],
  W: [-1, 0],
  NW: [-1, -1],
};
export const DIRECTION_LABELS: Record<Direction, string> = {
  N: 'North',
  NE: 'North east',
  E: 'East',
  SE: 'South east',
  S: 'South',
  SW: 'South west',
  W: 'West',
  NW: 'North west',
};
export const DIRECTION_ARROWS: Record<Direction, string> = {
  N: '↑',
  NE: '↗',
  E: '→',
  SE: '↘',
  S: '↓',
  SW: '↙',
  W: '←',
  NW: '↖',
};
export function opposite(d: Direction): Direction {
  return DIRECTIONS[(DIRECTIONS.indexOf(d) + 4) % 8];
}
export function directionBetween(
  a: Pick<Tile, 'x' | 'y'>,
  b: Pick<Tile, 'x' | 'y'>,
): Direction {
  return (
    DIRECTIONS.find(
      (d) =>
        VECTORS[d][0] === Math.sign(b.x - a.x) &&
        VECTORS[d][1] === Math.sign(b.y - a.y),
    ) ?? 'N'
  );
}
export function syncExits(board: Tile[]) {
  for (const t of board)
    t.exits = t.paths.filter((p) => p.outgoing).map((p) => p.target);
}
export function connect(
  board: Tile[],
  from: number,
  to: number,
  direction: Direction,
  entry: Direction,
  bidirectional: boolean,
  warp = false,
): boolean {
  const a = board.find((t) => t.id === from),
    b = board.find((t) => t.id === to);
  if (
    !a ||
    !b ||
    a.paths.some((p) => p.direction === direction) ||
    b.paths.some((p) => p.direction === entry) ||
    (a === b && direction === entry)
  )
    return false;
  a.paths.push({
    direction,
    target: to,
    entry,
    outgoing: true,
    incoming: bidirectional,
    warp,
  });
  b.paths.push({
    direction: entry,
    target: from,
    entry: direction,
    outgoing: bidirectional,
    incoming: true,
    warp,
  });
  syncExits(board);
  return true;
}
export function disconnect(board: Tile[], from: number, direction: Direction) {
  const a = board.find((t) => t.id === from)!;
  const path = a.paths.find((p) => p.direction === direction);
  if (!path) return;
  const b = board.find((t) => t.id === path.target)!;
  a.paths = a.paths.filter((p) => p.direction !== direction);
  b.paths = b.paths.filter(
    (p) => !(p.direction === path.entry && p.target === from),
  );
  syncExits(board);
}
export function boardEdges(board: Tile[]) {
  return board.flatMap((t) =>
    t.paths
      .filter(
        (p) =>
          p.outgoing &&
          (t.id < p.target ||
            !p.incoming ||
            (t.id === p.target &&
              DIRECTIONS.indexOf(p.direction) < DIRECTIONS.indexOf(p.entry))),
      )
      .map((p) => ({
        from: t,
        to: board.find((n) => n.id === p.target)!,
        ...p,
      })),
  );
}
