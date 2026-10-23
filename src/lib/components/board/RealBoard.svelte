<script lang="ts">
  import type { Tile } from '$lib/game/types';
  import { boardEdges, VECTORS } from '$lib/game/geometry';
  import {
    TILE_LABELS,
    groupShapeName,
    PLAYER_COLORS,
  } from '$lib/game/appearance';
  import TileGlyph from './TileGlyph.svelte';
  import AvatarGlyph from './AvatarGlyph.svelte';
  let {
    board,
    players,
    prefix = 'real',
  }: {
    board: Tile[];
    players: {
      id: string;
      name: string;
      tile?: number;
      avatar: string;
      color: string;
    }[];
    prefix?: string;
  } = $props();
  const width = $derived(
    (Math.max(0, ...board.map((t) => t.x)) + 1) * 160 + 100,
  );
  const height = $derived(
    (Math.max(0, ...board.map((t) => t.y)) + 1) * 150 + 100,
  );
  const edges = $derived(boardEdges(board).filter((e) => e.to));
  const center = (t: Tile) => ({ x: t.x * 160 + 130, y: t.y * 150 + 125 });
  function endpoint(t: Tile, d: keyof typeof VECTORS) {
    const c = center(t),
      v = VECTORS[d],
      length = Math.hypot(...v);
    return { x: c.x + (v[0] / length) * 64, y: c.y + (v[1] / length) * 64 };
  }
  function boundary(t: Tile, d: keyof typeof VECTORS) {
    const c = center(t),
      [dx, dy] = VECTORS[d];
    const distances = [
      ...(dx > 0 ? [(width - 16 - c.x) / dx] : dx < 0 ? [(16 - c.x) / dx] : []),
      ...(dy > 0
        ? [(height - 16 - c.y) / dy]
        : dy < 0
          ? [(16 - c.y) / dy]
          : []),
    ];
    const length = Math.min(...distances);
    return { x: c.x + dx * length, y: c.y + dy * length };
  }
</script>

<div class="board-scroll">
  <svg
    class="real-board"
    viewBox={`0 0 ${width} ${height}`}
    role="img"
    aria-label="Real game board with tile effects, connections and player positions"
  >
    <defs
      ><marker
        id={`${prefix}-arrow`}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
        ><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker
      ></defs
    >
    <rect
      x="8"
      y="8"
      width={width - 16}
      height={height - 16}
      rx="22"
      fill="var(--board)"
      stroke="var(--line)"
      stroke-dasharray="5 5"
    />
    {#each edges as edge, index}
      {@const a = endpoint(edge.from, edge.direction)}{@const b = endpoint(
        edge.to,
        edge.entry,
      )}
      {@const color = edge.warp
        ? PLAYER_COLORS[index % PLAYER_COLORS.length]
        : 'var(--connection)'}
      {#if edge.warp}
        {@const out = boundary(edge.from, edge.direction)}{@const into =
          boundary(edge.to, edge.entry)}
        <line
          x1={a.x}
          y1={a.y}
          x2={out.x}
          y2={out.y}
          stroke={color}
          stroke-width="3"
        />
        <line
          x1={into.x}
          y1={into.y}
          x2={b.x}
          y2={b.y}
          stroke={color}
          stroke-width="3"
          marker-end={!edge.incoming ? `url(#${prefix}-arrow)` : undefined}
        />
        <g fill={color} font-size="13" font-weight="800"
          ><text x={out.x + 5} y={Math.max(22, out.y - 6)}>W{index + 1}</text
          ><text x={into.x + 5} y={Math.max(22, into.y - 6)}>W{index + 1}</text
          ></g
        >
      {:else if edge.from.id === edge.to.id}
        <path
          d={`M ${a.x} ${a.y} C ${a.x + 90} ${a.y - 95}, ${b.x + 90} ${b.y - 95}, ${b.x} ${b.y}`}
          fill="none"
          stroke={color}
          stroke-width="3"
          marker-end={!edge.incoming ? `url(#${prefix}-arrow)` : undefined}
        />
      {:else}<line
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={color}
          stroke-width="3"
          marker-end={!edge.incoming ? `url(#${prefix}-arrow)` : undefined}
        />{/if}
    {/each}
    {#each board as t}
      {@const c = center(t)}{@const owner = players.find(
        (p) => p.id === t.owner,
      )}{@const occupants = players.filter((p) => p.tile === t.id)}
      <g transform={`translate(${c.x},${c.y})`}
        ><title
          >Tile {t.id}: {TILE_LABELS[t.kind]}{t.kind === 'property'
            ? ` · ${groupShapeName(t.group ?? 0)} group ${(t.group ?? 0) + 1} · ${owner?.name ?? 'Unowned'} · ${t.houses} houses`
            : ''}</title
        ><TileGlyph
          kind={t.kind}
          group={t.group}
          label={String(t.id)}
          ownerColor={owner?.color}
          houses={t.houses}
        />
        {#each occupants as p, i}<g
            transform={`translate(${(i - (occupants.length - 1) / 2) * 30},48)`}
            ><title>{p.name}</title><AvatarGlyph
              avatar={p.avatar}
              color={p.color}
              size={16}
            /></g
          >{/each}
      </g>
    {/each}
  </svg>
</div>
<p class="muted">
  Lines run both ways. Arrows run one way. Matching colored W labels connect
  routes that leave and re-enter the board. Hover over a tile or avatar for
  details.
</p>
<div class="legend">
  {#each Object.entries(TILE_LABELS) as [kind, label]}<span
      class={`legend-${kind}`}>{label}</span
    >{/each}<span
    >Property shape = group · Fill = owner · Border = property effect</span
  >
</div>

<style>
  .real-board {
    display: block;
    width: 100%;
    min-width: 650px;
    max-height: 1000px;
  }
  .board-scroll {
    overflow: auto;
  }
  .legend {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
  }
  .legend span {
    border-left: 5px solid #7c3aed;
    padding-left: 0.4rem;
  }
  .legend .legend-jail {
    border-color: #64748b;
  }
  .legend .legend-go {
    border-color: #15936a;
  }
  .legend .legend-shop {
    border-color: #d59413;
  }
  .legend .legend-good {
    border-color: #0b91b2;
  }
  .legend .legend-bad {
    border-color: #d64165;
  }
  .legend .legend-neutral {
    border-color: #a8b3bd;
  }
</style>
