import { randomInt, randomUUID } from 'node:crypto';
import { createGame, newPlayer, act, view } from './engine';
import type { Game, Action } from '../../game/types';
import { AVATARS, PLAYER_COLORS } from '../../game/appearance';
// One authoritative process. Replace this repository with shared persistence before scaling horizontally.
// Keep rooms alive across development hot reloads as well as client reconnects.
const runtime = globalThis as typeof globalThis & {
  monopoRuntime?: {
    games: Map<string, Game>;
    sessions: Map<string, { id: string; expires: number }>;
  };
};
const state: NonNullable<typeof runtime.monopoRuntime> =
  (runtime.monopoRuntime ??= {
    games: new Map(),
    sessions: new Map(),
  });
const { games, sessions } = state;

/** Public player IDs must never serve as authentication credentials. */
export function identity(token: string): string {
  const session = sessions.get(token);
  if (session && session.expires > Date.now()) return session.id;
  return '';
}
export function session(token: string): string {
  const existing = identity(token);
  if (existing) return existing;
  const id = randomUUID();
  sessions.set(token, { id, expires: Date.now() + 86400000 });
  return id;
}
export function create(id: string) {
  cleanup();
  let code: string;
  do {
    code = String(randomInt(100000, 1000000));
  } while (games.has(code));
  const game = createGame(code, id);
  games.set(code, game);
  return view(game, id);
}
function cleanup() {
  for (const [code, g] of games)
    if (Date.now() - g.hostSeen > 300000) games.delete(code);
}
export function get(code: string, id: string) {
  cleanup();
  const g = games.get(code);
  if (!g) throw Error('This lobby does not exist or has expired.');
  if (g.host === id) {
    g.hostSeen = Date.now();
    return g;
  }
  const p = g.players.find((p) => p.id === id);
  if (!p) throw Error('Join this lobby first.');
  if (Date.now() - p.seen > 300000)
    throw Error('Your reconnect window has expired.');
  p.seen = Date.now();
  if (g.host === id) g.hostSeen = Date.now();
  return g;
}
export function join(code: string, id: string, name: string) {
  cleanup();
  const g = games.get(code);
  if (!g) throw Error('This lobby does not exist or has expired.');
  if (g.host === id || g.players.some((p) => p.id === id))
    return view(get(code, id), id);
  if (g.status !== 'lobby') throw Error('This game has already started.');
  if (g.players.length >= 30) throw Error('This lobby is full.');
  const player = newPlayer(id, name);
  if (
    g.players.some(
      (p) =>
        p.name.toLocaleLowerCase('en-US') ===
        player.name.toLocaleLowerCase('en-US'),
    )
  )
    throw Error('That name is already taken in this lobby.');
  player.avatar = AVATARS[g.players.length % AVATARS.length];
  player.color = PLAYER_COLORS[g.players.length % PLAYER_COLORS.length];
  g.players.push(player);
  return view(g, id);
}
export function dispatch(code: string, id: string, action: Action) {
  const g = get(code, id);
  const next = structuredClone(g);
  act(next, id, action);
  games.set(code, next);
  return view(next, id);
}
