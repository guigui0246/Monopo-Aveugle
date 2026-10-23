export type TileKind =
  'property' | 'jail' | 'go' | 'shop' | 'good' | 'bad' | 'neutral';
export type Item =
  | 'teleport'
  | 'jail'
  | 'steal-property'
  | 'move-go'
  | 'question'
  | 'reveal'
  | 'steal-money'
  | 'house';
export const ITEMS: Item[] = [
  'teleport',
  'jail',
  'steal-property',
  'move-go',
  'question',
  'reveal',
  'steal-money',
  'house',
];
export interface Settings {
  tiles: number;
  money: number;
  go: number;
  groups: number;
  properties: number;
  inventory: number;
  shopCost: number;
  shopIncrease: number;
  propertyCost: number;
  rent: number;
  replay: boolean;
}
export const DEFAULTS: Settings = {
  tiles: 20,
  money: 1500,
  go: 200,
  groups: 4,
  properties: 3,
  inventory: 3,
  shopCost: 12,
  shopIncrease: 3,
  propertyCost: 100,
  rent: 50,
  replay: true,
};
export interface Tile {
  id: number;
  kind: TileKind;
  exits: number[];
  group?: number;
  owner?: string;
  houses: number;
  cash: number;
  x: number;
  y: number;
  paths: Path[];
}
export const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type Direction = (typeof DIRECTIONS)[number];
export interface Path {
  direction: Direction;
  target: number;
  entry: Direction;
  outgoing: boolean;
  incoming: boolean;
  warp: boolean;
}
export interface Player {
  id: string;
  name: string;
  money: number;
  items: Item[];
  tile: number;
  seen: number;
  connected: number;
  avatar: string;
  color: string;
}
export interface Entry {
  time: number;
  message: string;
  private?: boolean;
}
export interface Game {
  code: string;
  host: string;
  status: 'lobby' | 'playing' | 'ended';
  settings: Settings;
  players: Player[];
  board: Tile[];
  turn: number;
  phase: 'before' | 'after';
  log: Entry[];
  prices: Record<Item, number>;
  hostSeen: number;
  jailRolled?: boolean;
  startedInJail?: boolean;
  effects?: { player: string; good: boolean; depth: number }[];
  questions?: number;
  pending?: { player: string; kind: 'jail' | 'steal' }[];
  reveal?: { tiles: number[]; ends: Record<string, number> };
}
export type Action = {
  type: string;
  target?: string;
  tile?: number;
  item?: Item;
  settings?: Partial<Settings>;
  answer?: string;
  direction?: Direction | 'here';
  avatar?: string;
  color?: string;
};
