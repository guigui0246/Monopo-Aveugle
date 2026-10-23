<script lang="ts">
  import { untrack } from 'svelte';
  import type { Settings } from '$lib/game/types';
  let {
    settings,
    locked = false,
    save,
  }: {
    settings: Settings;
    locked?: boolean;
    save: (settings: Partial<Settings>) => void;
  } = $props();
  let draft = $state(untrack(() => ({ ...settings })));
  let baseline = $state(untrack(() => JSON.stringify(settings)));
  $effect(() => {
    const value = JSON.stringify(settings);
    if (value !== baseline) {
      baseline = value;
      draft = { ...settings };
    }
  });
  const dirty = $derived(JSON.stringify(draft) !== JSON.stringify(settings));
  const labels: Record<string, string> = {
    tiles: 'Tiles',
    money: 'Starting money',
    go: 'Go reward',
    groups: 'Property groups',
    properties: 'Properties per group',
    inventory: 'Inventory capacity',
    shopCost: 'Initial item price',
    shopIncrease: 'Price increase per purchase',
    propertyCost: 'Property cost',
    rent: 'Base rent',
  };
</script>

<section>
  <h2>Game settings</h2>
  <form
    onsubmit={(e) => {
      e.preventDefault();
      save(
        locked
          ? {
              shopIncrease: draft.shopIncrease,
              propertyCost: draft.propertyCost,
              rent: draft.rent,
              replay: draft.replay,
            }
          : draft,
      );
    }}
  >
    {#each Object.keys(labels).filter((key) => !locked || ['shopIncrease', 'propertyCost', 'rent'].includes(key)) as key}<label
        >{labels[key]}<input
          aria-label={labels[key]}
          type="number"
          min="0"
          step="1"
          disabled={locked &&
            !['shopIncrease', 'propertyCost', 'rent'].includes(key)}
          bind:value={(draft as unknown as Record<string, number>)[key]}
        /></label
      >{/each}<label
      >Allow record download<input
        type="checkbox"
        bind:checked={draft.replay}
      /></label
    >{#if dirty}<button>Save settings</button>{/if}
  </form>
</section>
