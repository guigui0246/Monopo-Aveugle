<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import Notebook from '$lib/components/Notebook.svelte';
  import GameSettings from '$lib/components/GameSettings.svelte';
  import RealBoard from '$lib/components/board/RealBoard.svelte';
  import TurnPanel from '$lib/components/game/TurnPanel.svelte';
  import PlayerList from '$lib/components/game/PlayerList.svelte';
  import { ITEMS, type Action } from '$lib/game/types';
  import type { GameView } from '$lib/game/view';
  let game = $state<GameView>();
  let error = $state('');
  let busy = $state(false);
  let confirmations = $state(0);
  let now = $state(Date.now());
  let refreshing = false;
  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      const r = await fetch(`/api/games/${page.params.code}`);
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      if (!busy) game = data;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      refreshing = false;
    }
  }
  async function action(a: Action) {
    if (busy) return;
    busy = true;
    error = '';
    try {
      const r = await fetch(`/api/games/${page.params.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      game = { ...data, me: game!.me };
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
  onMount(() => {
    refresh();
    const timer = setInterval(() => {
      now = Date.now();
      refresh();
    }, 1000);
    return () => clearInterval(timer);
  });
  const revealEnd = $derived(game?.reveal?.ends[game.me] ?? 0);
</script>

<svelte:head
  ><title>Room {page.params.code} · Monopo Aveugle</title></svelte:head
>
<main>
  <nav><a href="/">Home</a><a href="/rules">Rulebook</a></nav>
  <p class="badge">{game?.isHost ? 'HOST DESK' : 'HIDDEN BOARD GAME'}</p>
  <h1>Room {page.params.code}</h1>
  {#if error}<p role="alert" class="error">{error}</p>{/if}
  {#if game}<p class="muted">
      {game.status} · {game.isHost
        ? 'You guide the game. Only you see the real board.'
        : 'Keep your map secret. Follow the connections, one turn at a time.'}
    </p>
    <div class="grid">
      <PlayerList {game} {action} />
      {#if game.status === 'lobby'}<section>
          <h2>Waiting room</h2>
          <p>Share <strong>{game.code}</strong> with your players.</p>
          <p class="muted">
            {game.players.length} players · {game.settings.tiles} tiles. The board
            needs 5–10 tiles per player.
          </p>
          {#if game.controls.start}<button
              disabled={busy}
              onclick={() => action({ type: 'start' })}>Start game</button
            >{:else if game.isHost}<p class="muted">
              Add players or adjust the tile count to start.
            </p>{:else}<p class="muted">
              The host will start when everyone is ready.
            </p>{/if}
        </section>{/if}
      {#if game.status === 'playing'}<TurnPanel {game} {action} {busy} />{/if}
      {#if game.isHost && game.status === 'lobby'}<GameSettings
          settings={game.settings}
          locked={game.status !== 'lobby'}
          save={(settings) => action({ type: 'settings', settings })}
        />{/if}
    </div>
    <div class="stack">
      {#if game.isHost && game.status === 'playing'}<details class="panel">
          <summary>Adjust game settings</summary><GameSettings
            settings={game.settings}
            locked={true}
            save={(settings) => action({ type: 'settings', settings })}
          />
        </details>{/if}
      {#if game.reveal}<section>
          <h2>Shared reveal</h2>
          {#if game.controls.reveal}<button
              disabled={busy}
              onclick={() => action({ type: 'view' })}
              >Start my 30 seconds</button
            >{:else if revealEnd > now}<p>
              You have {Math.ceil((revealEnd - now) / 1000)} seconds left.
            </p>{:else}<p class="muted">
              {game.isHost
                ? 'Players are viewing the reveal on their own timers.'
                : 'Your viewing time is finished. Waiting for everyone else.'}
            </p>{/if}
          {#if game.reveal.tiles.length && revealEnd > now}<RealBoard
              board={game.reveal.tiles}
              players={game.players}
              prefix="reveal"
            />{/if}
          <p class="muted">
            {Object.values(game.reveal.ends).filter(
              (end) => end > 0 && end <= now,
            ).length}/{game.players.length} players finished.
          </p>
          {#if game.controls.resume}<button
              disabled={busy}
              onclick={() => action({ type: 'resume' })}>Resume game</button
            >{/if}
        </section>{/if}
      {#if game.isHost && game.board.length}<section>
          <h2>The real board</h2>
          <RealBoard board={game.board} players={game.players} />
        </section>{/if}
      {#if game.controls.answer}<section>
          <h2>Answer a player’s question</h2>
          <p>The answer must be truthful.</p>
          <div class="row">
            {#each ['yes', 'no', 'I don’t know', 'Invalid'] as answer}<button
                disabled={busy}
                onclick={() => action({ type: 'answer', answer })}
                >{answer}</button
              >{/each}
          </div>
        </section>{/if}
      {#if game.status === 'playing'}<section>
          <h2>Shop catalogue</h2>
          <p class="muted">
            Buy when you are on a shop tile, with enough money and space in your
            inventory.
          </p>
          <div class="grid">
            {#each ITEMS as item}<div
                class="row"
                style="justify-content:space-between"
              >
                <span>{item} · {game.prices[item]} coins</span
                >{#if game.controls.buyItems.includes(item)}<button
                    disabled={busy}
                    onclick={() => action({ type: 'buy', item })}
                    >Buy {item}</button
                  >{/if}
              </div>{/each}
          </div>
        </section>{/if}
      {#if !game.isHost && game.status !== 'lobby'}<Notebook
          groups={game.settings.groups}
          code={game.code}
          me={game.me}
          players={game.players}
        />{/if}
      <section>
        <h2>Game record</h2>
        {#if !game.log.length}<p class="muted">
            The story starts when the host begins the game.
          </p>{/if}{#each game.log.slice(-50).reverse() as entry}<p>
            <small>{new Date(entry.time).toLocaleTimeString()}</small>
            {entry.message}
          </p>{/each}{#if game.status === 'ended' && (game.settings.replay || game.isHost)}<a
            class="button"
            href={`/api/games/${game.code}?replay`}>Download game record</a
          >{/if}
      </section>
      {#if game.isHost && game.status === 'playing'}<details class="panel">
          <summary>End this game</summary>
          <p>Ending the game stops play for everyone. Confirm twice.</p>
          <button
            disabled={busy}
            onclick={() => {
              if (confirmations === 0) confirmations = 1;
              else action({ type: 'end', answer: 'END GAME' });
            }}
            >{confirmations === 0
              ? 'End game now'
              : 'Confirm: end for everyone'}</button
          >{#if confirmations}<button onclick={() => (confirmations = 0)}
              >Keep playing</button
            >{/if}
        </details>{/if}
    </div>{:else}<p>Connecting to the room…</p>{/if}
</main>
