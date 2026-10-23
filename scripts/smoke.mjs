import assert from 'node:assert/strict';
const base = process.env.BASE_URL ?? 'http://localhost:5173';
async function request(path, body, cookie) {
  const res = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    res,
    data: await res.json(),
    cookie: res.headers.get('set-cookie')?.split(';')[0],
  };
}
const host = await request('/api/games', {});
assert.equal(host.res.status, 200);
assert.equal(host.data.players.length, 0);
const code = host.data.code;
const guest = await request('/api/games', { name: 'Guest', code });
assert.equal(guest.res.status, 200);
assert.equal(
  (await request('/api/games', { name: ' guest ', code })).res.status,
  400,
);
const second = await request('/api/games', { name: 'Second', code });
assert.equal(second.res.status, 200);
assert.equal(
  (await request(`/api/games/${code}`, { type: 'start' }, guest.cookie)).res
    .status,
  400,
);
assert.equal(
  (await request(`/api/games/${code}`, { type: 'start' }, host.cookie)).res
    .status,
  200,
);
const h = await request(`/api/games/${code}`, undefined, host.cookie);
const p = await request(`/api/games/${code}`, undefined, guest.cookie);
assert.equal(h.data.board.length, 20);
assert.equal(p.data.board.length, 0);
assert.ok(p.data.players.every((p) => p.tile === undefined));
assert.equal(
  (await request('/api/games', { name: 'Late', code })).res.status,
  400,
);
assert.equal(
  (await request(`/api/games/${code}?replay`, undefined, guest.cookie)).res
    .status,
  400,
);
assert.equal(
  (
    await request(
      `/api/games/${code}`,
      { type: 'end', answer: 'END GAME' },
      host.cookie,
    )
  ).res.status,
  200,
);
assert.equal(
  (await request(`/api/games/${code}?replay`, undefined, guest.cookie)).res
    .status,
  200,
);
for (const path of ['/', '/rules', '/settings', `/game/${code}`])
  assert.equal((await fetch(base + path)).status, 200);
console.log(
  'HTTP smoke passed: create, join, permissions, start, hidden state, late join, end, download, and page responses.',
);
