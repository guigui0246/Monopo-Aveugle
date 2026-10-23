import type { TileKind } from './types';
export const AVATARS = [
  '🦊',
  '🐈',
  '🐼',
  '🐸',
  '🐙',
  '🦉',
  '🐢',
  '🦋',
  '🚀',
  '🌻',
  '⭐',
  '👑',
];
export const PLAYER_COLORS = [
  '#2563eb',
  '#dc2626',
  '#059669',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#db2777',
  '#4f46e5',
];
export const TILE_COLORS: Record<TileKind, string> = {
  property: '#7c3aed',
  jail: '#64748b',
  go: '#15936a',
  shop: '#d59413',
  good: '#0b91b2',
  bad: '#d64165',
  neutral: '#a8b3bd',
};
export const TILE_LABELS: Record<TileKind, string> = {
  property: 'Property',
  jail: 'Jail',
  go: 'Go',
  shop: 'Shop',
  good: 'Good wheel',
  bad: 'Bad wheel',
  neutral: 'Neutral',
};
export const TILE_SYMBOLS: Record<TileKind, string> = {
  property: '',
  jail: '▥',
  go: 'GO',
  shop: '◆',
  good: '+',
  bad: '−',
  neutral: '·',
};
export const GROUP_SHAPES = [
  'Square',
  'Circle',
  'Triangle',
  'Diamond',
  'Pentagon',
  'Hexagon',
  'Heptagon',
  'Octagon',
];
export function contrastColor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 +
    ((n >> 8) & 255) * 0.587 +
    (n & 255) * 0.114 >
    160
    ? '#172230'
    : '#ffffff';
}
export function groupShapeName(group: number) {
  return GROUP_SHAPES[group] ?? `${group + 1}-gon`;
}
export function polygonPoints(group: number, radius = 43): string {
  const index = group;
  const sides = index === 0 || index === 3 ? 4 : index === 2 ? 3 : index + 1;
  const offset = index === 0 ? Math.PI / 4 : -Math.PI / 2;
  const r = index === 0 ? radius * Math.SQRT2 : radius;
  return Array.from(
    { length: sides },
    (_, i) =>
      `${Math.cos(offset + (i * Math.PI * 2) / sides) * r},${Math.sin(offset + (i * Math.PI * 2) / sides) * r}`,
  ).join(' ');
}
