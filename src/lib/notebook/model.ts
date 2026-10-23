import { AVATARS } from '$lib/game/appearance';
import { TILE_LABELS } from '$lib/game/appearance';
import type { TileKind } from '$lib/game/types';
export interface Point {
  x: number;
  y: number;
}
export interface MapNode extends Point {
  id: string;
  type: 'tile' | 'avatar';
  kind: TileKind;
  group: number;
  label: string;
  avatar: string;
  color: string;
  ownerColor: string;
}
export interface MapLine {
  id: string;
  type: 'line' | 'arrow';
  from: Point;
  to: Point;
  fromNode?: string;
  toNode?: string;
  color: string;
}
export interface Drawing {
  nodes: MapNode[];
  lines: MapLine[];
}
export const emptyDrawing = (): Drawing => ({ nodes: [], lines: [] });
export function endpoints(line: MapLine, drawing: Drawing) {
  return {
    from: drawing.nodes.find((n) => n.id === line.fromNode) ?? line.from,
    to: drawing.nodes.find((n) => n.id === line.toNode) ?? line.to,
  };
}
/** Keep arrow heads outside attached objects instead of hiding them under a tile. */
export function visibleEndpoints(line: MapLine, drawing: Drawing) {
  const { from, to } = endpoints(line, drawing),
    dx = to.x - from.x,
    dy = to.y - from.y,
    length = Math.hypot(dx, dy) || 1;
  const inset = (id: string | undefined) => {
    const n = drawing.nodes.find((n) => n.id === id);
    return n ? (n.type === 'avatar' ? 30 : 64) : 0;
  };
  const start = Math.min(inset(line.fromNode), length * 0.4),
    end = Math.min(inset(line.toNode), length * 0.4);
  return {
    from: {
      x: from.x + (dx / length) * start,
      y: from.y + (dy / length) * start,
    },
    to: { x: to.x - (dx / length) * end, y: to.y - (dy / length) * end },
  };
}
export function removeObject(drawing: Drawing, id: string): Drawing {
  const node = drawing.nodes.find((n) => n.id === id);
  return {
    nodes: drawing.nodes.filter((n) => n.id !== id),
    lines: drawing.lines
      .filter((l) => l.id !== id)
      .map((l) => ({
        ...l,
        ...(l.fromNode === id
          ? { from: { x: node!.x, y: node!.y }, fromNode: undefined }
          : {}),
        ...(l.toNode === id
          ? { to: { x: node!.x, y: node!.y }, toNode: undefined }
          : {}),
      })),
  };
}
/** Reject malformed or obsolete local drafts rather than crashing the editor. */
export function readDrawing(raw: string): Drawing {
  const d = JSON.parse(raw) as Drawing;
  const point = (p: Point) =>
    p &&
    Number.isFinite(p.x) &&
    Number.isFinite(p.y) &&
    p.x >= 0 &&
    p.x <= 1200 &&
    p.y >= 0 &&
    p.y <= 760;
  const color = (c: string) => /^#[a-f0-9]{6}$/i.test(c);
  if (
    !d ||
    !Array.isArray(d.nodes) ||
    !Array.isArray(d.lines) ||
    d.nodes.length > 500 ||
    d.lines.length > 1000 ||
    !d.nodes.every(
      (n) =>
        n &&
        typeof n.id === 'string' &&
        point(n) &&
        ['tile', 'avatar'].includes(n.type) &&
        Object.hasOwn(TILE_LABELS, n.kind) &&
        Number.isInteger(n.group) &&
        n.group >= 0 &&
        n.group <= 300 &&
        typeof n.label === 'string' &&
        n.label.length <= 40 &&
        AVATARS.includes(n.avatar) &&
        color(n.color) &&
        (n.ownerColor === '' || color(n.ownerColor)),
    ) ||
    !d.lines.every(
      (l) =>
        l &&
        typeof l.id === 'string' &&
        ['line', 'arrow'].includes(l.type) &&
        point(l.from) &&
        point(l.to) &&
        color(l.color),
    )
  )
    throw Error('Invalid drawing');
  const ids = [...d.nodes.map((n) => n.id), ...d.lines.map((l) => l.id)];
  if (
    new Set(ids).size !== ids.length ||
    d.lines.some((l) =>
      [l.fromNode, l.toNode].some(
        (id) => id !== undefined && !d.nodes.some((n) => n.id === id),
      ),
    )
  )
    throw Error('Invalid object references');
  return d;
}
