<script lang="ts">
  import { onMount } from 'svelte';
  import { AVATARS, TILE_LABELS, groupShapeName } from '$lib/game/appearance';
  import {
    emptyDrawing,
    readDrawing,
    removeObject,
    endpoints,
    visibleEndpoints,
    type Drawing,
    type Point,
    type MapNode,
  } from '$lib/notebook/model';
  import type { TileKind } from '$lib/game/types';
  import TileGlyph from './board/TileGlyph.svelte';
  import AvatarGlyph from './board/AvatarGlyph.svelte';
  let {
    code,
    me,
    players,
    groups = 8,
  }: {
    code: string;
    me: string;
    players: { id: string; name: string; avatar: string; color: string }[];
    groups?: number;
  } = $props();
  let svg: SVGSVGElement;
  const shapeOptions = $derived(
    Array.from({ length: Math.max(8, groups) }, (_, i) => groupShapeName(i)),
  );
  let drawing = $state<Drawing>(emptyDrawing());
  let tool = $state<'select' | 'tile' | 'avatar' | 'line' | 'arrow'>('select');
  let selected = $state('');
  let menu = $state(false);
  let kind = $state<TileKind>('neutral');
  let group = $state(0);
  let avatar = $state(AVATARS[0]);
  let color = $state('#2563eb');
  let history = $state<string[]>([]);
  let future = $state<string[]>([]);
  let warning = $state('');
  let drag: { id: string; offset: Point; handle?: 'from' | 'to' } | undefined;
  let draft = $state<{ from: Point; to: Point; fromNode?: string }>();
  const node = $derived(drawing.nodes.find((n) => n.id === selected));
  const line = $derived(drawing.lines.find((l) => l.id === selected));
  const storageKey = () => `vector-notes-${code}-${me}`;
  function persist() {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(drawing));
      warning = '';
    } catch {
      warning =
        'Device storage is full or unavailable. Export your map to keep it.';
    }
  }
  function checkpoint() {
    const value = JSON.stringify(drawing);
    if (history.at(-1) !== value) {
      history = [...history.slice(-49), value];
      future = [];
      persist();
    }
  }
  function undo() {
    if (history.length < 2) return;
    future = [JSON.stringify(drawing), ...future];
    history = history.slice(0, -1);
    drawing = JSON.parse(history.at(-1)!);
    persist();
  }
  function redo() {
    if (!future.length) return;
    drawing = JSON.parse(future[0]);
    future = future.slice(1);
    history = [...history, JSON.stringify(drawing)];
    persist();
  }
  function point(e: PointerEvent | MouseEvent): Point {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      svg.getScreenCTM()!.inverse(),
    );
    return {
      x: Math.max(0, Math.min(1200, p.x)),
      y: Math.max(0, Math.min(760, p.y)),
    };
  }
  function hit(e: Event) {
    return (
      (e.target as Element)
        .closest('[data-object]')
        ?.getAttribute('data-object') ?? ''
    );
  }
  function nearest(p: Point) {
    return drawing.nodes.find((n) => Math.hypot(n.x - p.x, n.y - p.y) < 50);
  }
  function down(e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    svg.focus({ preventScroll: true });
    menu = false;
    const p = point(e),
      id = hit(e);
    svg.setPointerCapture(e.pointerId);
    if (tool === 'select') {
      selected = id;
      if (id) {
        const n = drawing.nodes.find((n) => n.id === id);
        const handle = (e.target as Element).getAttribute('data-handle') as
          'from' | 'to' | null;
        if (n) drag = { id, offset: { x: p.x - n.x, y: p.y - n.y } };
        else if (handle) drag = { id, offset: { x: 0, y: 0 }, handle };
      }
      return;
    }
    if (tool === 'tile' || tool === 'avatar') {
      if (drawing.nodes.length >= 500) {
        warning = 'This map has reached 500 objects.';
        return;
      }
      const n: MapNode = {
        id: crypto.randomUUID(),
        type: tool,
        kind,
        group,
        label:
          tool === 'tile'
            ? String(drawing.nodes.filter((n) => n.type === 'tile').length + 1)
            : '',
        avatar,
        color,
        ownerColor: '',
        ...p,
      };
      drawing.nodes.push(n);
      selected = n.id;
      checkpoint();
      return;
    }
    const start = nearest(p);
    draft = {
      from: start ? { x: start.x, y: start.y } : p,
      to: p,
      fromNode: start?.id,
    };
  }
  function move(e: PointerEvent) {
    const p = point(e);
    if (draft) draft.to = p;
    if (!drag) return;
    const n = drawing.nodes.find((n) => n.id === drag!.id);
    if (n) {
      n.x = Math.max(48, Math.min(1152, p.x - drag.offset.x));
      n.y = Math.max(48, Math.min(712, p.y - drag.offset.y));
    } else {
      const l = drawing.lines.find((l) => l.id === drag!.id);
      if (l && drag.handle) {
        l[drag.handle] = p;
        l[drag.handle === 'from' ? 'fromNode' : 'toNode'] = undefined;
      }
    }
  }
  function up(e: PointerEvent) {
    if (draft) {
      const p = point(e),
        end = nearest(p);
      if (
        Math.hypot(draft.from.x - p.x, draft.from.y - p.y) > 10 &&
        drawing.lines.length < 1000
      ) {
        const id = crypto.randomUUID();
        drawing.lines.push({
          id,
          type: tool === 'arrow' ? 'arrow' : 'line',
          from: draft.from,
          to: end ? { x: end.x, y: end.y } : p,
          fromNode: draft.fromNode,
          toNode: end?.id,
          color,
        });
        selected = id;
      }
      draft = undefined;
      checkpoint();
    }
    if (drag) {
      if (drag.handle) {
        const l = drawing.lines.find((l) => l.id === drag!.id)!;
        const end = nearest(l[drag.handle]);
        if (end) l[drag.handle === 'from' ? 'fromNode' : 'toNode'] = end.id;
      }
      drag = undefined;
      checkpoint();
    }
  }
  function context(e: MouseEvent) {
    const id = hit(e);
    if (id) {
      e.preventDefault();
      selected = id;
      menu = true;
      tool = 'select';
    }
  }
  function remove() {
    drawing = removeObject(drawing, selected);
    selected = '';
    menu = false;
    checkpoint();
  }
  function key(e: KeyboardEvent) {
    if (
      node &&
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
    ) {
      e.preventDefault();
      const step = e.shiftKey ? 25 : 5;
      node.x = Math.max(
        48,
        Math.min(
          1152,
          node.x +
            (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0),
        ),
      );
      node.y = Math.max(
        48,
        Math.min(
          712,
          node.y +
            (e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0),
        ),
      );
      checkpoint();
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selected) {
        e.preventDefault();
        remove();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      e.shiftKey ? redo() : undo();
    } else if (e.key === 'Escape') {
      selected = '';
      menu = false;
      draft = undefined;
    }
  }
  function exportSvg() {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '1200');
    clone.setAttribute('height', '760');
    const originals = [svg, ...svg.querySelectorAll('*')],
      copies = [clone, ...clone.querySelectorAll('*')];
    originals.forEach((el, i) => {
      const s = getComputedStyle(el);
      for (const prop of [
        'fill',
        'stroke',
        'color',
        'font-size',
        'font-family',
        'font-weight',
      ])
        copies[i].setAttribute(
          prop,
          s
            .getPropertyValue(prop)
            .replace(/url\(["']?[^)"']*#([^)"']+)["']?\)/g, 'url(#$1)'),
        );
    });
    clone.querySelectorAll('[data-editor-only]').forEach((el) => el.remove());
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: 'image/svg+xml',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monopo-map-${code}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  onMount(() => {
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) drawing = readDrawing(raw);
    } catch {
      warning = 'The saved drawing could not be restored.';
    }
    history = [JSON.stringify(drawing)];
  });
</script>

<section class="notebook">
  <h2>Your map notebook</h2>
  <p class="muted">
    Place tiles and avatars. Drag them with Select. Draw a line or arrow between
    objects to keep them connected. Right-click an object to edit it, or select
    it and open Edit. Your map stays on this device.
  </p>
  <div class="toolbar" aria-label="Drawing tools">
    {#each ['select', 'tile', 'avatar', 'line', 'arrow'] as option}<label
        class:chosen={tool === option}
        ><input
          type="radio"
          name={`tool-${code}`}
          value={option}
          bind:group={tool}
        />{option}</label
      >{/each}
    {#if history.length > 1}<button onclick={undo}>Undo</button
      >{/if}{#if future.length}<button onclick={redo}>Redo</button
      >{/if}{#if selected}<button onclick={() => (menu = !menu)}
        >Edit selected</button
      ><button onclick={remove}>Delete selected</button
      >{/if}{#if drawing.nodes.length || drawing.lines.length}<button
        onclick={exportSvg}>Export SVG</button
      >{/if}
  </div>
  <div class="row">
    {#if tool === 'tile'}<label
        >Tile effect<select bind:value={kind}
          >{#each Object.entries(TILE_LABELS) as [value, label]}<option {value}
              >{label}</option
            >{/each}</select
        ></label
      >{#if kind === 'property'}<label
          >Group shape<select bind:value={group}
            >{#each shapeOptions as shape, i}<option value={i}
                >{i + 1} · {shape}</option
              >{/each}</select
          ></label
        >{/if}{/if}{#if tool === 'avatar'}<label
        >Avatar<select bind:value={avatar}
          >{#each AVATARS as a}<option value={a}>{a}</option>{/each}</select
        ></label
      >{/if}{#if tool !== 'select'}<label
        >Color<input type="color" bind:value={color} /></label
      >{/if}
  </div>
  {#if menu && (node || line)}<div
      class="object-editor"
      aria-label="Selected object editor"
    >
      {#if node}<label
          >Object type<select bind:value={node.type} onchange={checkpoint}
            ><option value="tile">Tile</option><option value="avatar"
              >Avatar</option
            ></select
          ></label
        >
        {#if node.type === 'tile'}<label
            >Effect<select bind:value={node.kind} onchange={checkpoint}
              >{#each Object.entries(TILE_LABELS) as [value, label]}<option
                  {value}>{label}</option
                >{/each}</select
            ></label
          ><label
            >Label<input
              maxlength="40"
              bind:value={node.label}
              onchange={checkpoint}
            /></label
          >{#if node.kind === 'property'}<label
              >Group shape<select bind:value={node.group} onchange={checkpoint}
                >{#each shapeOptions as shape, i}<option value={i}
                    >{i + 1} · {shape}</option
                  >{/each}</select
              ></label
            ><label
              >Owner<select bind:value={node.ownerColor} onchange={checkpoint}
                ><option value="">Unowned</option>{#each players as p}<option
                    value={p.color}>{p.name}</option
                  >{/each}</select
              ></label
            >{/if}
        {:else}<label
            >Player preset<select
              value=""
              onchange={(e) => {
                const p = players.find((p) => p.id === e.currentTarget.value);
                if (p) {
                  node.avatar = p.avatar;
                  node.color = p.color;
                  checkpoint();
                }
              }}
              ><option value="">Choose a player</option
              >{#each players as p}<option value={p.id}
                  >{p.avatar} {p.name}</option
                >{/each}</select
            ></label
          ><label
            >Avatar<select bind:value={node.avatar} onchange={checkpoint}
              >{#each AVATARS as a}<option value={a}>{a}</option>{/each}</select
            ></label
          ><label
            >Border color<input
              type="color"
              bind:value={node.color}
              onchange={checkpoint}
            /></label
          >{/if}
      {:else if line}<label
          >Connection<select bind:value={line.type} onchange={checkpoint}
            ><option value="line">Bidirectional line</option><option
              value="arrow">One-way arrow</option
            ></select
          ></label
        ><label
          >Color<input
            type="color"
            bind:value={line.color}
            onchange={checkpoint}
          /></label
        >
        <p class="muted">
          Drag the endpoint handles to move or reconnect this line.
        </p>{/if}
    </div>{/if}
  {#if warning}<p role="status">{warning}</p>{/if}
  <div class="vector-scroll">
    <!-- The SVG is a focusable graphics application with keyboard editing and a labeled toolbar. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <svg
      bind:this={svg}
      class="vector-map"
      viewBox="0 0 1200 760"
      role="application"
      aria-label="Vector map editor. Select an object and press Delete to remove it. Right-click or use Edit selected to change its appearance."
      tabindex="0"
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={() => {
        draft = undefined;
        drag = undefined;
        checkpoint();
      }}
      oncontextmenu={context}
      onkeydown={key}
    >
      <defs
        ><pattern
          id={`dots-${code}`}
          width="25"
          height="25"
          patternUnits="userSpaceOnUse"
          ><circle cx="1" cy="1" r="1" fill="var(--line)" /></pattern
        ><marker
          id={`note-arrow-${code}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
          ><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker
        ></defs
      >
      <rect width="1200" height="760" fill="var(--board)" /><rect
        width="1200"
        height="760"
        fill={`url(#dots-${code})`}
      />
      {#each drawing.lines as l}{@const points = visibleEndpoints(l, drawing)}<g
          data-object={l.id}
          ><line
            x1={points.from.x}
            y1={points.from.y}
            x2={points.to.x}
            y2={points.to.y}
            stroke="transparent"
            stroke-width="20"
          /><line
            x1={points.from.x}
            y1={points.from.y}
            x2={points.to.x}
            y2={points.to.y}
            stroke={l.color}
            stroke-width={selected === l.id ? 5 : 3}
            marker-end={l.type === 'arrow'
              ? `url(#note-arrow-${code})`
              : undefined}
          /></g
        >{/each}
      {#if draft}<line
          x1={draft.from.x}
          y1={draft.from.y}
          x2={draft.to.x}
          y2={draft.to.y}
          stroke={color}
          stroke-width="3"
          stroke-dasharray="7 5"
        />{/if}
      {#each drawing.nodes as n}<g
          data-object={n.id}
          transform={`translate(${n.x},${n.y})`}
          ><title
            >{n.type === 'tile'
              ? `${TILE_LABELS[n.kind]} ${n.label}`
              : 'Player avatar'}</title
          >{#if selected === n.id}<rect
              data-editor-only="true"
              x="-54"
              y="-54"
              width="108"
              height="108"
              rx="8"
              fill="none"
              stroke="var(--accent)"
              stroke-dasharray="5 4"
            />{/if}{#if n.type === 'tile'}<TileGlyph
              kind={n.kind}
              group={n.group}
              label={n.label}
              ownerColor={n.ownerColor || undefined}
            />{:else}<AvatarGlyph
              avatar={n.avatar}
              color={n.color}
              size={26}
            />{/if}</g
        >{/each}
      {#if line && tool === 'select'}{@const p = endpoints(line, drawing)}<g
          data-object={line.id}
          data-editor-only="true"
          >{#each ['from', 'to'] as handle}<circle
              data-handle={handle}
              cx={p[handle as 'from' | 'to'].x}
              cy={p[handle as 'from' | 'to'].y}
              r="9"
              fill="var(--surface)"
              stroke="var(--accent)"
              stroke-width="3"
            />{/each}</g
        >{/if}
    </svg>
  </div>
</section>

<style>
  .toolbar {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .toolbar label {
    padding: 0.5rem;
    border: 1px solid var(--line);
    border-radius: 8px;
    text-transform: capitalize;
  }
  .toolbar .chosen {
    background: var(--accent-soft);
    border-color: var(--accent);
  }
  .vector-map {
    user-select: none;
    display: block;
    width: 100%;
    min-width: 650px;
    touch-action: none;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .vector-scroll {
    overflow: auto;
  }
  .object-editor {
    padding: 1rem;
    background: var(--board);
    border: 1px solid var(--line);
    border-radius: 12px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0 1rem;
    margin: 1rem 0;
  }
</style>
