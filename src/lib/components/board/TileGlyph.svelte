<script lang="ts">
  import {
    TILE_COLORS,
    TILE_SYMBOLS,
    polygonPoints,
    contrastColor,
  } from '$lib/game/appearance';
  import type { TileKind } from '$lib/game/types';
  let {
    kind,
    group = 0,
    ownerColor,
    label = '',
    houses = 0,
  }: {
    kind: TileKind;
    group?: number;
    ownerColor?: string;
    label?: string;
    houses?: number;
  } = $props();
  const fill = $derived(
    kind === 'property'
      ? (ownerColor ?? 'var(--property-empty)')
      : TILE_COLORS[kind],
  );
  const stroke = $derived(TILE_COLORS[kind]);
</script>

<g
  class="tile-glyph"
  style:--glyph-text={kind === 'property'
    ? ownerColor
      ? contrastColor(ownerColor)
      : 'var(--ink)'
    : 'white'}
>
  {#if kind === 'property'}
    {#if group === 1}<circle
        r="43"
        {fill}
        {stroke}
        stroke-width="5"
      />{:else}<polygon
        points={polygonPoints(group)}
        {fill}
        {stroke}
        stroke-width="5"
        stroke-linejoin="round"
      />{/if}
  {:else}<rect
      x="-45"
      y="-38"
      width="90"
      height="76"
      rx="15"
      {fill}
      {stroke}
      stroke-width="3"
    />{/if}
  <text
    text-anchor="middle"
    y={kind === 'property' ? 5 : -4}
    font-size="18"
    font-weight="750"
    fill="currentColor">{kind === 'property' ? label : TILE_SYMBOLS[kind]}</text
  >
  {#if kind !== 'property'}<text
      text-anchor="middle"
      y="20"
      font-size="14"
      fill="currentColor">{label}</text
    >{/if}
  {#if houses}<text
      text-anchor="middle"
      y="28"
      font-size="11"
      fill="currentColor">⌂ {houses}</text
    >{/if}
</g>

<style>
  .tile-glyph {
    color: var(--glyph-text);
  }
</style>
