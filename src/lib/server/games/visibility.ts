import type { Game } from '../../game/types';
import { tile } from './effects';
import { ITEMS } from '../../game/types';
export function view(g: Game, id: string) {
  const host = g.host === id;
  const self = g.players.find((p) => p.id === id);
  const current = self && g.status === 'playing' ? tile(g, self) : undefined;
  const active = g.status === 'playing' && g.players[g.turn]?.id === id;
  const paused = Boolean(g.reveal || g.pending?.length);
  const ready = Boolean(active && !paused && g.jailRolled);
  const revealFinished = Boolean(
    g.reveal &&
    Object.values(g.reveal.ends).every((end) => end > 0 && end <= Date.now()),
  );
  return {
    ...g,
    host: undefined,
    hostSeen: undefined,
    isHost: host,
    players: g.players.map((p) => ({
      ...p,
      tile: host ? p.tile : undefined,
      seen: undefined,
      connected: undefined,
    })),
    board: host ? g.board : [],
    exits:
      current?.paths
        .filter((path) => path.outgoing)
        .map((path) => path.direction) ?? [],
    controls: {
      start:
        host &&
        g.status === 'lobby' &&
        g.players.length > 0 &&
        g.settings.tiles >= 5 * g.players.length &&
        g.settings.tiles <= 10 * g.players.length,
      move: ready && g.phase === 'before',
      finish: ready && g.phase === 'after',
      jail: active && !paused && !g.jailRolled,
      buyProperty:
        ready &&
        current?.kind === 'property' &&
        !current.owner &&
        self!.money >= g.settings.propertyCost,
      buyItems:
        ready &&
        current?.kind === 'shop' &&
        self!.items.length < g.settings.inventory
          ? ITEMS.filter((item) => self!.money >= g.prices[item])
          : [],
      useItems: ready ? [...new Set(self!.items)] : [],
      wheelTarget: g.pending?.[0]?.player === id && !g.reveal,
      reveal: Boolean(self && g.reveal && !g.reveal.ends[id]),
      resume: revealFinished,
      answer: host && g.status === 'playing' && Boolean(g.questions),
    },
    log: g.log.filter((e) => host || !e.private),
    reveal: g.reveal
      ? {
          tiles:
            g.reveal.ends[id] > Date.now()
              ? g.board.filter((t) => g.reveal!.tiles.includes(t.id))
              : [],
          ends: g.reveal.ends,
        }
      : undefined,
  };
}
