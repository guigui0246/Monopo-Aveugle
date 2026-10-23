import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateBoard } from '../src/lib/server/games/board';
import {
  createGame,
  newPlayer,
  start,
  act,
  view,
} from '../src/lib/server/games/engine';
import { connect, disconnect } from '../src/lib/game/geometry';
import { DEFAULTS, DIRECTIONS } from '../src/lib/game/types';
import { create, join, dispatch, get } from '../src/lib/server/games/store';
import { randomUUID } from 'node:crypto';
function game() {
  const g = createGame('123456', 'host');
  g.players.push(newPlayer('one', 'One'), newPlayer('two', 'Two'));
  start(g);
  g.jailRolled = true;
  g.startedInJail = false;
  return g;
}
test('host is an independent observer and can manage an empty lobby', () => {
  const g = createGame('123456', 'host');
  assert.deepEqual(g.players, []);
  assert.equal(view(g, 'host').controls.start, false);
  act(g, 'host', { type: 'settings', settings: { money: 2000 } });
  assert.equal(g.settings.money, 2000);
  assert.throws(
    () => act(g, 'host', { type: 'profile', avatar: '🦊', color: '#123456' }),
    /host/,
  );
});
test('host cannot move, own items, or take a turn', () => {
  const g = game();
  assert.equal(
    g.players.some((p) => p.id === 'host'),
    false,
  );
  assert.throws(() => act(g, 'host', { type: 'move', direction: 'N' }), /host/);
  assert.equal(view(g, 'host').controls.move, false);
  assert.deepEqual(view(g, 'host').exits, []);
});
test('every geometric connection has unique direction slots and a matching endpoint', () => {
  for (const tiles of [20, 21, 34, 100, 300]) {
    const board = generateBoard({ ...DEFAULTS, tiles });
    for (const t of board) {
      assert.equal(
        new Set(t.paths.map((p) => p.direction)).size,
        t.paths.length,
      );
      assert.ok(t.paths.length <= 8);
      for (const p of t.paths) {
        const other = board.find((t) => t.id === p.target)!;
        assert.ok(
          other.paths.some(
            (back) =>
              back.target === t.id &&
              back.direction === p.entry &&
              back.entry === p.direction &&
              back.incoming === p.outgoing &&
              back.outgoing === p.incoming,
          ),
        );
      }
      assert.deepEqual(
        t.exits,
        t.paths.filter((p) => p.outgoing).map((p) => p.target),
      );
    }
    for (const from of board) {
      const visited = new Set<number>(),
        todo = [from.id];
      while (todo.length) {
        const id = todo.pop()!;
        if (visited.has(id)) continue;
        visited.add(id);
        todo.push(...board.find((t) => t.id === id)!.exits);
      }
      assert.equal(visited.size, tiles);
    }
  }
});
test('player moves expose compass directions without destination identifiers', () => {
  const g = game(),
    p = g.players[0],
    v = view(g, p.id);
  assert.ok(v.exits.every((d) => DIRECTIONS.includes(d)));
  assert.equal(v.players.find((x) => x.id === p.id)!.tile, undefined);
  assert.deepEqual(v.board, []);
  const t = g.board.find((t) => t.id === p.tile)!;
  const path = t.paths.find((p) => p.outgoing)!;
  g.board.find((t) => t.id === path.target)!.kind = 'neutral';
  assert.throws(
    () => act(g, p.id, { type: 'move', tile: path.target }),
    /connected/,
  );
  act(g, p.id, { type: 'move', direction: path.direction });
  assert.equal(p.tile, path.target);
});
test('occupied directional ports cannot be reused', () => {
  const b = generateBoard(DEFAULTS),
    a = b[0],
    p = a.paths[0];
  assert.equal(connect(b, a.id, b[2].id, p.direction, 'N', true), false);
  const destination = b.find((t) => t.id === p.target)!;
  disconnect(b, a.id, p.direction);
  assert.ok(!a.paths.some((n) => n.direction === p.direction));
  assert.ok(
    !destination.paths.some(
      (n) => n.direction === p.entry && n.target === a.id,
    ),
  );
});
test('duplicate names are rejected after case, whitespace and Unicode normalization', () => {
  const h = randomUUID(),
    room = create(h);
  join(room.code, randomUUID(), '  Alice   Smith ');
  for (const name of ['alice smith', 'ALICE SMITH', 'Ａｌｉｃｅ Smith'])
    assert.throws(() => join(room.code, randomUUID(), name), /already taken/);
  assert.equal(get(room.code, h).players.length, 1);
});
test('custom avatars and colors persist and invalid profiles cannot mutate state', () => {
  const host = randomUUID(),
    p = randomUUID(),
    room = create(host);
  join(room.code, p, 'Player');
  dispatch(room.code, p, { type: 'profile', avatar: '🐼', color: '#f1a123' });
  assert.equal(get(room.code, p).players[0].avatar, '🐼');
  assert.equal(get(room.code, host).players[0].color, '#f1a123');
  assert.throws(() =>
    dispatch(room.code, p, {
      type: 'profile',
      avatar: '<script>',
      color: 'red',
    }),
  );
  assert.equal(get(room.code, p).players[0].color, '#f1a123');
});
test('contextual actions are hidden for other players and unavailable purchases', () => {
  const g = game(),
    p = g.players[0],
    other = g.players[1];
  p.tile = g.board.find((t) => t.kind === 'shop')!.id;
  p.money = 0;
  assert.deepEqual(view(g, p.id).controls.buyItems, []);
  p.money = 100;
  assert.equal(view(g, p.id).controls.buyItems.length, 8);
  assert.equal(view(g, other.id).controls.move, false);
  g.reveal = { tiles: [p.tile], ends: { [p.id]: 0, [other.id]: 0 } };
  assert.equal(view(g, p.id).controls.move, false);
  assert.equal(view(g, 'host').controls.reveal, false);
  assert.equal(view(g, p.id).controls.reveal, true);
});
