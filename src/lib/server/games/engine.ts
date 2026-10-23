import { pick, note } from './random';
import { tile, land, wheel, jail, pay, drainEffects } from './effects';
import { useItem } from './inventory';
import { generateBoard } from './board';
import { randomInt } from 'node:crypto';
import { AVATARS, PLAYER_COLORS } from '../../game/appearance';
import {
  DEFAULTS,
  ITEMS,
  type Game,
  type Player,
  type Settings,
  type Tile,
  type Item,
  type Action,
} from '../../game/types';
export function createGame(code: string, host: string): Game {
  return {
    code,
    host,
    status: 'lobby',
    settings: { ...DEFAULTS },
    players: [],
    board: [],
    turn: 0,
    phase: 'before',
    log: [],
    prices: Object.fromEntries(
      ITEMS.map((i) => [i, DEFAULTS.shopCost]),
    ) as Record<Item, number>,
    hostSeen: Date.now(),
  };
}
export function newPlayer(id: string, name: string): Player {
  if (typeof name !== 'string' || !name.trim() || name.length > 32)
    throw Error('Enter a name of 1–32 characters.');
  return {
    id,
    name: name.normalize('NFKC').trim().replace(/\s+/g, ' '),
    money: 0,
    items: [],
    tile: 0,
    seen: Date.now(),
    connected: Date.now(),
    avatar: AVATARS[0],
    color: PLAYER_COLORS[0],
  };
}
export function validateSettings(s: Settings) {
  if (typeof s.replay !== 'boolean')
    throw Error('Replay permission must be on or off.');
  for (const [key, value] of Object.entries(s))
    if (
      key !== 'replay' &&
      (!Number.isSafeInteger(value) ||
        (value as number) < 0 ||
        (value as number) > 100000)
    )
      throw Error('Settings must be non-negative whole numbers.');
  if (
    s.tiles < 5 ||
    s.tiles > 300 ||
    s.inventory < 1 ||
    s.inventory > 30 ||
    s.properties < 2 ||
    s.groups < 1 ||
    s.groups * s.properties > s.tiles - 5
  )
    throw Error(
      'Use 5–300 tiles, 1–30 inventory slots, and leave five non-property tiles.',
    );
}
export function start(g: Game) {
  validateSettings(g.settings);
  const n = g.players.length;
  if (n === 0 || g.settings.tiles < 5 * n || g.settings.tiles > 10 * n)
    throw Error('The board must have 5–10 tiles per player.');
  g.board = generateBoard(g.settings);
  for (let i = g.players.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [g.players[i], g.players[j]] = [g.players[j], g.players[i]];
  }
  for (const p of g.players) {
    p.tile = pick(g.board).id;
    p.money = g.settings.money;
    p.items = [];
  }
  g.prices = Object.fromEntries(
    ITEMS.map((i) => [i, g.settings.shopCost]),
  ) as Record<Item, number>;
  g.status = 'playing';
  g.startedInJail = tile(g, g.players[0]).kind === 'jail';
  g.jailRolled = !g.startedInJail;
  note(g, 'The game has started. Starting locations are private.');
}
export function act(g: Game, id: string, a: Action) {
  const p = g.players.find((p) => p.id === id);
  const host = id === g.host;
  if (!p && !host) throw Error('Join this lobby first.');
  if (a.type === 'profile') {
    if (!p) throw Error('The host does not have a player avatar.');
    if (
      !AVATARS.includes(a.avatar ?? '') ||
      !/^#[0-9a-f]{6}$/i.test(a.color ?? '')
    )
      throw Error('Choose a valid avatar and color.');
    p.avatar = a.avatar!;
    p.color = a.color!;
    return;
  }
  if (a.type === 'settings') {
    if (!host) throw Error('Host only.');
    const allowed =
      g.status === 'lobby'
        ? Object.keys(DEFAULTS)
        : ['shopIncrease', 'propertyCost', 'rent', 'replay'];
    const s = { ...g.settings };
    for (const [k, v] of Object.entries(a.settings ?? {})) {
      if (!allowed.includes(k)) throw Error('This setting is locked.');
      (s as unknown as Record<string, unknown>)[k] = v;
    }
    validateSettings(s);
    g.settings = s;
    return;
  }
  if (a.type === 'start') {
    if (!host || g.status !== 'lobby')
      throw Error('Only the host can start a lobby.');
    start(g);
    return;
  }
  if (a.type === 'end') {
    if (!host || a.answer !== 'END GAME')
      throw Error('Host must confirm END GAME.');
    g.status = 'ended';
    note(g, 'The host ended the game.');
    return;
  }
  if (a.type === 'answer') {
    if (
      !host ||
      !g.questions ||
      !['yes', 'no', 'I don’t know', 'Invalid'].includes(a.answer ?? '')
    )
      throw Error('Choose a valid host answer.');
    note(g, `Host answer: ${a.answer}`);
    g.questions!--;
    return;
  }
  if (g.status !== 'playing') throw Error('The game is not running.');
  if (g.reveal) {
    if (a.type === 'view') {
      if (!p) throw Error('Only players need to view the reveal.');
      if (!g.reveal.ends[id]) g.reveal.ends[id] = Date.now() + 30000;
      return;
    }
    if (
      Object.values(g.reveal.ends).every((end) => end > 0 && end <= Date.now())
    ) {
      delete g.reveal;
      drainEffects(g);
    } else throw Error('Wait for everyone to finish the reveal.');
    if (g.reveal || g.pending?.length) return;
    if (a.type === 'resume') return;
  }
  if (g.pending?.length) {
    const pending = g.pending[0];
    if (a.type !== 'wheel-target' || pending.player !== id)
      throw Error('Resolve the wheel player choice first.');
    const victim = g.players.find((p) => p.id === a.target && p.id !== id);
    if (!victim) throw Error('Choose another player.');
    g.pending.shift();
    if (pending.kind === 'jail') {
      jail(g, victim, 0, false);
      wheel(g, victim, false);
    } else pay(victim, p!, 100);
    drainEffects(g);
    return;
  }
  if (!p) throw Error('The host manages the game and does not take turns.');
  if (g.players[g.turn].id !== id) throw Error('Wait for your turn.');
  const t = tile(g, p);
  if (a.type === 'jail-roll') {
    if (g.jailRolled) throw Error('No jail roll is due.');
    g.jailRolled = true;
    wheel(g, p, false);
    return;
  }
  if (!g.jailRolled)
    throw Error('Resolve your start-of-turn jail wheel first.');
  if (a.type === 'move') {
    const path = t.paths.find(
      (path) => path.direction === a.direction && path.outgoing,
    );
    if (g.phase !== 'before' || !path || a.tile !== undefined)
      throw Error('Choose a connected tile before moving.');
    p.tile = path.target;
    g.phase = 'after';
    if (!(g.startedInJail && tile(g, p).kind === 'jail')) land(g, p);
    return;
  }
  if (a.type === 'finish') {
    if (g.phase !== 'after') throw Error('Move before ending your turn.');
    g.turn = (g.turn + 1) % g.players.length;
    g.phase = 'before';
    g.startedInJail = tile(g, g.players[g.turn]).kind === 'jail';
    g.jailRolled = !g.startedInJail;
    return;
  }
  if (a.type === 'buy-property') {
    if (t.kind !== 'property' || t.owner || p.money < g.settings.propertyCost)
      throw Error('This property cannot be purchased.');
    p.money -= g.settings.propertyCost;
    t.owner = id;
    note(g, `${p.name} bought tile ${t.id}.`);
    return;
  }
  if (a.type === 'buy') {
    if (
      t.kind !== 'shop' ||
      !ITEMS.includes(a.item!) ||
      p.items.length >= g.settings.inventory ||
      p.money < g.prices[a.item!]
    )
      throw Error('Visit a shop with enough money and inventory space.');
    p.money -= g.prices[a.item!];
    p.items.push(a.item!);
    g.prices[a.item!] += g.settings.shopIncrease;
    return;
  }
  if (a.type === 'use') return useItem(g, p, a);
  throw Error('Unknown action.');
}
export { view } from './visibility';
