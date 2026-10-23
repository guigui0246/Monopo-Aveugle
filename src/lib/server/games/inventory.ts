import { randomInt } from 'node:crypto';
import type { Game, Player, Action } from '../../game/types';
import { pick, note } from './random';
import { tile, land, jail, reveal, pay } from './effects';
export function useItem(g: Game, p: Player, a: Action) {
  const id = p.id;
  const t = tile(g, p);
  const destination =
    a.direction === 'here'
      ? p.tile
      : t.paths.find((path) => path.direction === a.direction && path.outgoing)
          ?.target;

  const index = p.items.indexOf(a.item!);
  if (index < 0) throw Error('You do not own this item.');
  const target = g.players.find((p) => p.id === a.target);
  if (
    ['teleport', 'jail'].includes(a.item!) &&
    (!target || (a.item === 'jail' && target.id === id))
  )
    throw Error('Choose a valid player.');
  if (a.item === 'steal-money' && destination === undefined)
    throw Error('Choose your tile or an adjacent tile.');
  p.items.splice(index, 1);
  switch (a.item) {
    case 'teleport':
      target!.tile = pick(g.board).id;
      note(g, `Teleport roll: ${target!.tile}.`);
      if (g.phase === 'after') land(g, target!);
      break;
    case 'jail': {
      const roll = randomInt(100);
      if (roll < 50) jail(g, target!, 0, g.phase === 'after');
      else if (roll < 55) jail(g, p, 0, g.phase === 'after');
      break;
    }
    case 'steal-property':
      if (
        t.kind === 'property' &&
        t.owner &&
        t.owner !== id &&
        randomInt(4) === 0
      ) {
        for (const prop of g.board.filter(
          (x) => x.group === t.group && x.kind === 'property',
        )) {
          const owner = g.players.find((p) => p.id === prop.owner);
          while (prop.houses > 0) {
            if (owner && owner.items.length < g.settings.inventory)
              owner.items.push('house');
            prop.houses--;
          }
        }
        t.owner = id;
      }
      break;
    case 'move-go':
      for (const go of g.board.filter((t) => t.kind === 'go')) {
        const other = pick(g.board);
        [go.kind, other.kind] = [other.kind, go.kind];
        [go.group, other.group] = [other.group, go.group];
        [go.owner, other.owner] = [other.owner, go.owner];
        [go.houses, other.houses] = [other.houses, go.houses];
        note(g, `Go moved to ${other.id}.`, true);
      }
      break;
    case 'question':
      g.questions = (g.questions ?? 0) + 1;
      note(g, `${p.name} may ask the host a yes/no question.`);
      break;
    case 'reveal':
      reveal(g, p);
      break;
    case 'steal-money':
      for (const victim of g.players.filter(
        (v) => v.tile === destination && v.id !== id,
      ))
        pay(victim, p, Math.floor(victim.money * 0.05));
      break;
    case 'house':
      if (
        t.kind === 'property' &&
        t.owner === id &&
        g.board
          .filter((x) => x.kind === 'property' && x.group === t.group)
          .every((x) => x.owner === id)
      )
        t.houses++;
      break;
  }
  return;
}
