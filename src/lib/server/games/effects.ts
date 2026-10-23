import { randomInt } from 'node:crypto';
import type { Game, Player } from '../../game/types';
import { pick, note } from './random';
import {
  connect,
  disconnect,
  directionBetween,
  opposite,
} from '../../game/geometry';
export const tile = (g: Game, p: Player) =>
  g.board.find((t) => t.id === p.tile)!;
export function pay(from: Player, to: Player | undefined, amount: number) {
  const paid = Math.min(from.money, Math.max(0, amount));
  from.money -= paid;
  if (to) to.money += paid;
}
export function reveal(g: Game, p: Player) {
  g.reveal = {
    tiles: [p.tile, ...tile(g, p).exits],
    ends: Object.fromEntries(g.players.map((p) => [p.id, 0])),
  };
  note(g, 'A reveal is ready. Each player must view it for 30 seconds.');
}
export function jail(g: Game, p: Player, depth: number, apply = true) {
  const was = tile(g, p).kind === 'jail';
  p.tile = g.board.find((t) => t.kind === 'jail')!.id;
  note(g, `${p.name} was sent to jail.`);
  if (!was && apply) wheel(g, p, false, depth + 1);
}
export function land(g: Game, p: Player, depth = 0) {
  if (depth > 20) throw Error('Effect chain is too long.');
  const t = tile(g, p);
  if (t.cash) {
    p.money += t.cash;
    t.cash = 0;
  }
  switch (t.kind) {
    case 'property':
      note(
        g,
        `Tile ${t.id}: ${t.owner ? g.players.find((p) => p.id === t.owner)?.name : 'unowned'}; ${t.houses} houses; monopoly: ${Boolean(t.owner && g.board.filter((other) => other.kind === 'property' && other.group === t.group).every((other) => other.owner === t.owner)) ? 'yes' : 'no'}.`,
      );
      if (t.owner && t.owner !== p.id)
        pay(
          p,
          g.players.find((p) => p.id === t.owner),
          g.settings.rent * 2 ** Math.min(t.houses, 30),
        );
      break;
    case 'go':
      p.money += g.settings.go;
      note(g, `${p.name} collected ${g.settings.go}.`);
      break;
    case 'good':
      wheel(g, p, true, depth + 1);
      break;
    case 'bad':
      wheel(g, p, false, depth + 1);
      break;
    case 'jail':
      wheel(g, p, false, depth + 1);
      break;
  }
}
const processing = new WeakSet<Game>();

/** Preserve nested wheel order across interactive target choices and reveals. */
export function drainEffects(g: Game) {
  if (processing.has(g)) return;
  processing.add(g);
  try {
    while (g.effects?.length && !g.pending?.length && !g.reveal) {
      const effect = g.effects.shift()!;
      resolveWheel(
        g,
        g.players.find((p) => p.id === effect.player)!,
        effect.good,
        effect.depth,
      );
    }
  } finally {
    processing.delete(g);
  }
}

export function wheel(g: Game, p: Player, good: boolean, depth = 0) {
  (g.effects ??= []).unshift({ player: p.id, good, depth });
  drainEffects(g);
}

function resolveWheel(g: Game, p: Player, good: boolean, depth = 0) {
  if (depth > 20) {
    note(g, 'Wheel chain limit reached.');
    return;
  }
  const roll = randomInt(1, 9);
  note(g, `${p.name}: ${good ? 'good' : 'bad'} wheel rolled ${roll}.`);
  if (good) {
    switch (roll) {
      case 1:
        wheel(g, p, false, depth + 1);
        break;
      case 3:
        (g.pending ??= []).push({ player: p.id, kind: 'jail' });
        note(g, 'Choose a player to jail using the wheel action.');
        break;
      case 4:
        g.questions = (g.questions ?? 0) + 1;
        note(g, 'Ask the host a yes/no question.');
        break;
      case 5:
        reveal(g, p);
        break;
      case 6: {
        const all = g.board.filter((t) => t.kind === 'go');
        if (all.length) {
          p.tile = pick(all).id;
          p.money += 200;
        }
        break;
      }
      case 7:
        (g.pending ??= []).push({ player: p.id, kind: 'steal' });
        note(g, 'Choose a player to steal 100 from using the wheel action.');
        break;
      case 8:
        p.money += 200;
        break;
    }
  } else
    switch (roll) {
      case 1:
        wheel(g, p, false, depth + 1);
        wheel(g, p, false, depth + 1);
        break;
      case 2: {
        const owned = g.board.filter((t) => t.owner === p.id);
        if (owned.length) {
          const t = pick(owned);
          delete t.owner;
          t.houses = 0;
        }
        break;
      }
      case 3:
        jail(g, p, depth);
        break;
      case 4: {
        const change = randomInt(3);
        if (change === 0) {
          const choices = g.board.filter(
            (t) => t.kind !== 'property' && t.kind !== 'jail',
          );
          if (choices.length)
            pick(choices).kind = pick([
              'go',
              'shop',
              'good',
              'bad',
              'neutral',
            ] as const);
        } else if (change === 1) {
          const choices = g.board.filter((t) => t.kind !== 'property');
          const first = pick(choices),
            second = pick(choices);
          [first.kind, second.kind] = [second.kind, first.kind];
          for (const player of g.players) {
            if (player.tile === first.id) player.tile = second.id;
            else if (player.tile === second.id) player.tile = first.id;
          }
        } else {
          const from = pick(g.board);
          const to = pick(
            g.board.filter(
              (t) =>
                t.id !== from.id &&
                Math.abs(t.x - from.x) <= 1 &&
                Math.abs(t.y - from.y) <= 1,
            ),
          );
          const direction = directionBetween(from, to);
          const existing = from.paths.find((p) => p.direction === direction);
          if (existing) {
            // Never remove the guaranteed route: each remaining graph must stay strongly connected.
            const saved = structuredClone(g.board);
            disconnect(g.board, from.id, direction);
            const reachable = (start: number) => {
              const seen = new Set<number>();
              const queue = [start];
              while (queue.length) {
                const id = queue.pop()!;
                if (seen.has(id)) continue;
                seen.add(id);
                queue.push(...g.board.find((t) => t.id === id)!.exits);
              }
              return seen.size === g.board.length;
            };
            if (!g.board.every((t) => reachable(t.id))) g.board = saved;
          } else
            connect(
              g.board,
              from.id,
              to.id,
              direction,
              opposite(direction),
              randomInt(2) === 0,
            );
        }
        note(g, 'The map changed.');
        break;
      }
      case 5:
        p.tile = pick(g.board).id;
        note(g, `Random tile: ${p.tile}.`);
        land(g, p, depth + 1);
        break;
      case 6: {
        const t = pick(g.board);
        const dropped = Math.min(p.money, 100);
        pay(p, undefined, dropped);
        t.cash += dropped;
        note(g, `Dropped ${dropped} on ${t.id}.`, true);
        break;
      }
      case 8:
        wheel(g, p, true, depth + 1);
        break;
    }
}
