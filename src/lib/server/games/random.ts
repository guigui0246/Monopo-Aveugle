import { randomInt } from 'node:crypto';
import type { Game } from '../../game/types';
export const pick = <T>(items: T[]): T => items[randomInt(items.length)];
export const note = (g: Game, message: string, secret = false) =>
  g.log.push({ time: Date.now(), message, private: secret });
