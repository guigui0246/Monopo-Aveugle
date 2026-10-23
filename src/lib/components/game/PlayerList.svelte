<script lang="ts">
  import type { GameView } from '$lib/game/view';
  import type { Action } from '$lib/game/types';
  import AvatarEditor from '../AvatarEditor.svelte';
  let { game, action }: { game: GameView; action: (a: Action) => void } =
    $props();
  const self = $derived(game.players.find((p) => p.id === game.me));
</script>

<section>
  <h2>Players · {game.players.length}</h2>
  {#if !game.players.length}<p class="muted">
      Share the room number. The host does not occupy a player seat.
    </p>{/if}{#each game.players as p}<div class="player-entry">
      <span class="player-avatar" style:--player-color={p.color}
        >{p.avatar}</span
      >
      <div>
        <p>
          <strong>{p.name}</strong>
          {game.status === 'playing' && game.players[game.turn]?.id === p.id
            ? '· Current turn'
            : ''}
        </p>
        <small
          >{p.money} coins · {p.items.join(', ') || 'No items'}{game.isHost &&
          game.status !== 'lobby'
            ? ` · Tile ${p.tile}`
            : ''}</small
        >
      </div>
    </div>{/each}{#if self}<AvatarEditor player={self} save={action} />{/if}
</section>
