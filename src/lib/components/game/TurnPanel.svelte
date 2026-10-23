<script lang="ts">
  import type { GameView } from '$lib/game/view';
  import type { Action, Direction } from '$lib/game/types';
  import { DIRECTION_LABELS } from '$lib/game/geometry';
  import Movement from './Movement.svelte';
  let {
    game,
    action,
    busy,
  }: { game: GameView; action: (a: Action) => void; busy: boolean } = $props();
  let target = $state('');
  let destination = $state<Direction | 'here'>('here');
  $effect(() => {
    if (destination !== 'here' && !game.exits.includes(destination))
      destination = 'here';
  });
  const self = $derived(game.players.find((p) => p.id === game.me));
  const c = $derived(game.controls);
  const targets = $derived(game.players.filter((p) => p.id !== game.me));
  const needTarget = $derived(
    c.wheelTarget ||
      c.useItems.some((item) => item === 'teleport' || item === 'jail'),
  );
</script>

<section>
  <h2>
    {game.players[game.turn]?.id === game.me
      ? 'Your turn'
      : `${game.players[game.turn]?.name ?? 'Player'}’s turn`}
  </h2>
  {#if game.reveal}<p class="muted">
      Play is paused for the shared reveal.
    </p>{:else if game.pending?.length}<p class="muted">
      Waiting for {game.players.find((p) => p.id === game.pending?.[0].player)
        ?.name} to choose a player.
    </p>{:else if game.players[game.turn]?.id !== game.me}<p class="muted">
      Watch the game record while the current player takes their turn.
    </p>{/if}
  {#if c.jail}<p>Begin your turn by resolving the bad wheel.</p>
    <button disabled={busy} onclick={() => action({ type: 'jail-roll' })}
      >Resolve jail wheel</button
    >{/if}
  {#if c.move}<p>Follow one connection. Its destination is hidden.</p>
    <Movement
      directions={game.exits}
      {busy}
      move={(direction) => action({ type: 'move', direction })}
    />{/if}
  {#if c.buyProperty}<button
      disabled={busy}
      onclick={() => action({ type: 'buy-property' })}
      >Buy property · {game.settings.propertyCost} coins</button
    >{/if}
  {#if needTarget}<label
      >Target player<select bind:value={target}
        ><option value="">Choose a player</option
        >{#each game.players.filter((p) => !c.wheelTarget || p.id !== game.me) as p}<option
            value={p.id}>{p.avatar} {p.name}</option
          >{/each}</select
      ></label
    >{/if}
  {#if c.wheelTarget && targets.some((p) => p.id === target)}<button
      disabled={busy}
      onclick={() => action({ type: 'wheel-target', target })}
      >Confirm player choice</button
    >{/if}
  {#if c.useItems.includes('steal-money')}<label
      >Steal money from<select bind:value={destination}
        ><option value="here">This tile</option>{#each game.exits as d}<option
            value={d}>{DIRECTION_LABELS[d]} connection</option
          >{/each}</select
      ></label
    >{/if}
  {#if c.useItems.length}<h3>Your items</h3>
    <div class="row">
      {#each c.useItems as item}{#if !['teleport', 'jail'].includes(item) || game.players.some((p) => p.id === target && (item !== 'jail' || p.id !== game.me))}<button
            disabled={busy}
            onclick={() =>
              action({ type: 'use', item, target, direction: destination })}
            >Use {item} · {self?.items.filter((i) => i === item).length}</button
          >{/if}{/each}
    </div>
    {#if needTarget && !target}<p class="muted">
        Choose a target to use a teleportation or jail item.
      </p>{/if}{/if}
  {#if c.finish}<div style="margin-top:1rem">
      <button disabled={busy} onclick={() => action({ type: 'finish' })}
        >End turn</button
      >
    </div>{/if}
</section>
