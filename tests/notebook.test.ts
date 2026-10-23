import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyDrawing,
  endpoints,
  visibleEndpoints,
  removeObject,
  readDrawing,
  type MapNode,
} from '../src/lib/notebook/model';
const node = (id: string, x: number): MapNode => ({
  id,
  x,
  y: 100,
  type: 'tile',
  kind: 'property',
  group: 0,
  label: id,
  avatar: '🦊',
  color: '#2563eb',
  ownerColor: '',
});
test('vector connections follow dragged objects and leave arrowheads visible', () => {
  const d = emptyDrawing();
  d.nodes = [node('a', 100), node('b', 400)];
  const line = {
    id: 'line',
    type: 'arrow' as const,
    from: { x: 0, y: 0 },
    to: { x: 0, y: 0 },
    fromNode: 'a',
    toNode: 'b',
    color: '#2563eb',
  };
  d.lines.push(line);
  assert.equal(endpoints(line, d).to.x, 400);
  d.nodes[1].x = 500;
  assert.equal(endpoints(line, d).to.x, 500);
  assert.equal(visibleEndpoints(line, d).to.x, 436);
});
test('deleting an object detaches its lines while preserving their positions', () => {
  const d = emptyDrawing();
  d.nodes = [node('a', 100), node('b', 400)];
  d.lines.push({
    id: 'l',
    type: 'line',
    from: { x: 0, y: 0 },
    to: { x: 0, y: 0 },
    fromNode: 'a',
    toNode: 'b',
    color: '#2563eb',
  });
  const after = removeObject(d, 'a');
  assert.equal(after.nodes.length, 1);
  assert.equal(after.lines[0].fromNode, undefined);
  assert.deepEqual(after.lines[0].from, { x: 100, y: 100 });
  assert.equal(after.lines[0].toNode, 'b');
});
test('vector drafts round-trip and invalid saved drafts are rejected', () => {
  const d = emptyDrawing();
  d.nodes = [node('a', 100)];
  assert.deepEqual(readDrawing(JSON.stringify(d)), d);
  assert.throws(() => readDrawing('{'));
  assert.throws(() =>
    readDrawing(
      JSON.stringify({
        nodes: [{ ...node('a', 100), x: Infinity }],
        lines: [],
      }),
    ),
  );
  assert.throws(() =>
    readDrawing(
      JSON.stringify({
        nodes: [{ ...node('a', 100), avatar: 'bad' }],
        lines: [],
      }),
    ),
  );
});
