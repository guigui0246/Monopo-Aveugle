import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  create,
  join,
  dispatch,
  get,
  session,
  identity,
} from '../src/lib/server/games/store';

test('public IDs cannot be used as session credentials', () => {
  const token = randomUUID();
  const id = session(token);
  assert.notEqual(token, id);
  assert.equal(identity(token), id);
  assert.equal(identity(id), '');
});
test('rejected actions leave authoritative state unchanged', () => {
  const id = randomUUID();
  const g = create(id);
  assert.throws(() =>
    dispatch(g.code, id, { type: 'settings', settings: { tiles: -1 } }),
  );
  assert.equal(get(g.code, id).settings.tiles, 20);
});
test('started rooms reject new devices but permit known players to reconnect', () => {
  const host = randomUUID(),
    guest = randomUUID();
  const g = create(host);
  join(g.code, guest, 'Guest');
  join(g.code, randomUUID(), 'Second player');
  dispatch(g.code, host, { type: 'start' });
  assert.throws(() => join(g.code, randomUUID(), 'Late'), /already started/);
  assert.equal(join(g.code, guest, 'Guest').players.length, 2);
});
test('reveal starts once per player and blocks turn actions', () => {
  const host = randomUUID(),
    guest = randomUUID();
  const game = create(host);
  join(game.code, guest, 'Guest');
  const second = randomUUID();
  join(game.code, second, 'Second player');
  dispatch(game.code, host, { type: 'start' });
  const g = get(game.code, host);
  g.reveal = { tiles: [1, 2], ends: { [second]: 0, [guest]: 0 } };
  assert.throws(
    () => dispatch(g.code, g.players[g.turn].id, { type: 'finish' }),
    /reveal/,
  );
  dispatch(g.code, guest, { type: 'view' });
  const first = get(g.code, guest).reveal!.ends[guest];
  dispatch(g.code, guest, { type: 'view' });
  assert.equal(get(g.code, guest).reveal!.ends[guest], first);
});
