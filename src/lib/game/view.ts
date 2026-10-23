import type { view } from '../server/games/visibility';
export type GameView = ReturnType<typeof view> & { me: string };
