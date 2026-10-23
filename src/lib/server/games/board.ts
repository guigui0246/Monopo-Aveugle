import { randomInt } from 'node:crypto';
import { DIRECTIONS, type Settings, type Tile } from '../../game/types';
import {
  connect,
  directionBetween,
  opposite,
  VECTORS,
} from '../../game/geometry';

/** A connected backbone; every connection occupies a unique slot at both ends. */
export function generateBoard(settings: Settings): Tile[] {
  const columns = Math.ceil(Math.sqrt(settings.tiles));
  const positions = Array.from(
    { length: Math.ceil(settings.tiles / columns) },
    (_, y) =>
      Array.from({ length: columns }, (_, i) => ({
        x: y % 2 ? columns - 1 - i : i,
        y,
      })),
  )
    .flat()
    .slice(0, settings.tiles);
  const ids = Array.from({ length: settings.tiles }, (_, i) => i + 1);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const kinds = ['jail', 'go', 'shop', 'good', 'bad'] as const;
  const count = settings.groups * settings.properties;
  const board = ids.map((id, i): Tile => ({
    id,
    ...positions[i],
    kind: i < count ? 'property' : (kinds[i - count] ?? 'neutral'),
    group: i < count ? Math.floor(i / settings.properties) : undefined,
    paths: [],
    exits: [],
    houses: 0,
    cash: 0,
  }));
  for (let i = 0; i < board.length - 1; i++) {
    const a = board[i],
      b = board[i + 1],
      d = directionBetween(a, b);
    connect(board, a.id, b.id, d, opposite(d), true);
  }
  const first = board[0],
    last = board.at(-1)!;
  const outward = (t: Tile) =>
    DIRECTIONS.filter(
      (d) =>
        !board.some(
          (n) => n.x === t.x + VECTORS[d][0] && n.y === t.y + VECTORS[d][1],
        ) && !t.paths.some((p) => p.direction === d),
    );
  connect(
    board,
    last.id,
    first.id,
    outward(last)[0],
    outward(first)[0],
    true,
    true,
  );
  const candidates = board.flatMap((a) =>
    board
      .filter(
        (b) =>
          a.id < b.id && Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1,
      )
      .map((b) => ({ a, b })),
  );
  let extra = Math.floor(board.length / 2) - 1;
  while (candidates.length && extra > 0) {
    const { a, b } = candidates.splice(randomInt(candidates.length), 1)[0];
    const d = directionBetween(a, b);
    if (connect(board, a.id, b.id, d, opposite(d), randomInt(2) === 0)) extra--;
  }
  return board;
}
