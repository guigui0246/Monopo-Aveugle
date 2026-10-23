import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  newPlayer,
  start,
  act,
  view,
} from '../src/lib/server/games/engine';
function fixture() {
  const g = createGame('123456', 'host');
  g.players.push(newPlayer('alpha', 'Alpha'), newPlayer('guest', 'Guest'));
  g.settings.tiles = 20;
  start(g);
  g.jailRolled = true;
  g.startedInJail = false;
  return g;
}
test('launch validates board to player ratio', () => {
  const g = createGame('123456', 'host');
  assert.throws(() => start(g), /5–10/);
});
test('player views hide board, locations and private records', () => {
  const g = fixture();
  g.log.push({ time: 1, message: 'secret', private: true });
  const v = view(g, 'guest');
  assert.deepEqual(v.board, []);
  assert.ok(v.players.every((p) => p.tile === undefined));
  assert.ok(v.log.every((e) => !e.private));
  assert.equal(view(g, 'host').board.length, 20);
});
test('generated board has unique identifiers and an exit on every tile', () => {
  const g = fixture();
  assert.equal(new Set(g.board.map((t) => t.id)).size, 20);
  assert.ok(
    g.board.every(
      (t) =>
        t.exits.length > 0 &&
        t.exits.every((id) => g.board.some((n) => n.id === id)),
    ),
  );
});
test('only active player can move and movement follows graph', () => {
  const g = fixture();
  const p = g.players[g.turn];
  assert.throws(
    () =>
      act(g, g.players.find((x) => x.id !== p.id)!.id, {
        type: 'move',
        tile: 1,
      }),
    /Wait/,
  );
  assert.throws(() => act(g, p.id, { type: 'move', tile: 999 }), /connected/);
  const t = g.board.find((t) => t.id === p.tile)!;
  const dest = g.board.find((candidate) => candidate.id === t.exits[0])!;
  t.kind = 'neutral';
  dest.kind = 'neutral';
  act(g, p.id, {
    type: 'move',
    direction: t.paths.find((path) => path.outgoing && path.target === dest.id)!
      .direction,
  });
  assert.equal(g.phase, 'after');
  act(g, p.id, { type: 'finish' });
  assert.equal(g.turn, 1);
});
test('host privileges and locked settings are enforced', () => {
  const g = fixture();
  assert.throws(
    () => act(g, 'guest', { type: 'end', answer: 'END GAME' }),
    /Host/,
  );
  assert.throws(
    () => act(g, 'host', { type: 'settings', settings: { tiles: 25 } }),
    /locked/,
  );
});
test('property purchase is charged once and transfers ownership', () => {
  const g = fixture();
  const p = g.players[0];
  const t = g.board.find((t) => t.kind === 'property')!;
  p.tile = t.id;
  act(g, p.id, { type: 'buy-property' });
  assert.equal(t.owner, p.id);
  assert.equal(p.money, 1400);
  assert.throws(() => act(g, p.id, { type: 'buy-property' }), /cannot/);
});

test('rent doubles for each house and transfers to the owner', () => {
  const g = fixture();
  const owner = g.players[0],
    visitor = g.players[1];
  const property = g.board.find((t) => t.kind === 'property')!;
  property.owner = owner.id;
  property.houses = 2;
  const from = g.board.find((t) =>
    t.paths.some((path) => path.outgoing && path.target === property.id),
  )!;
  from.kind = 'neutral';
  visitor.tile = from.id;
  g.turn = 1;
  act(g, visitor.id, {
    type: 'move',
    direction: from.paths.find(
      (path) => path.outgoing && path.target === property.id,
    )!.direction,
  });
  assert.equal(visitor.money, 1300);
  assert.equal(owner.money, 1700);
});

test('consumables are lost even when a house cannot be built', () => {
  const g = fixture(),
    p = g.players[0];
  p.items = ['house'];
  const current = g.board.find((t) => t.id === p.tile)!;
  current.kind = 'neutral';
  act(g, p.id, { type: 'use', item: 'house' });
  assert.deepEqual(p.items, []);
  assert.equal(current.houses, 0);
});

test('wheel continuation survives a player choice', () => {
  const g = fixture(),
    p = g.players[0],
    victim = g.players[1];
  g.pending = [{ player: p.id, kind: 'steal' }];
  g.effects = [{ player: p.id, good: true, depth: 21 }];
  act(g, p.id, { type: 'wheel-target', target: victim.id });
  assert.equal(p.money, 1600);
  assert.equal(victim.money, 1400);
  assert.equal(g.effects.length, 0);
  assert.ok(g.log.some((e) => e.message.includes('limit')));
});
