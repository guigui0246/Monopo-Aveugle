<script lang="ts">
  import {
    VECTORS,
    DIRECTION_ARROWS,
    DIRECTION_LABELS,
  } from '$lib/game/geometry';
  import type { Direction } from '$lib/game/types';
  let {
    directions,
    move,
    busy,
  }: {
    directions: Direction[];
    move: (direction: Direction) => void;
    busy: boolean;
  } = $props();
</script>

<div class="compass">
  <svg viewBox="0 0 300 300" aria-hidden="true"
    >{#each directions as d}{@const v = VECTORS[d]}<line
        x1={150 + v[0] * 26}
        y1={150 + v[1] * 26}
        x2={150 + v[0] * 78}
        y2={150 + v[1] * 78}
        stroke="var(--connection)"
        stroke-width="4"
      />{/each}<circle
      cx="150"
      cy="150"
      r="23"
      fill="var(--accent-soft)"
      stroke="var(--accent)"
      stroke-width="2"
    /><text
      x="150"
      y="155"
      text-anchor="middle"
      fill="var(--ink)"
      font-size="12">YOU</text
    ></svg
  >
  {#each directions as d}{@const v = VECTORS[d]}<button
      style:grid-column={v[0] + 2}
      style:grid-row={v[1] + 2}
      aria-label={`Move ${DIRECTION_LABELS[d]}`}
      title={DIRECTION_LABELS[d]}
      disabled={busy}
      onclick={() => move(d)}>{DIRECTION_ARROWS[d]}<small>{d}</small></button
    >{/each}
</div>

<style>
  .compass {
    display: grid;
    grid-template: repeat(3, 90px) / repeat(3, 90px);
    width: 270px;
    height: 270px;
    position: relative;
    margin: 1rem auto;
  }
  .compass svg {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .compass button {
    z-index: 1;
    align-self: center;
    justify-self: center;
    font-size: 1.6rem;
    width: 68px;
    height: 68px;
    padding: 0.1rem;
    background: var(--surface);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .compass small {
    font-size: 0.65rem;
  }
</style>
