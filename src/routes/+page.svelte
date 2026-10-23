<script lang="ts">
  import { goto } from '$app/navigation';
  let name = $state('');
  let code = $state('');
  let error = $state('');
  let busy = $state(false);
  async function connect(join = false) {
    busy = true;
    error = '';
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(join ? { name, code: code.trim() } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error);
      await goto(`/game/${data.code}`);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head
  ><title>Monopo Aveugle · A map you cannot see</title><meta
    name="description"
    content="A hidden-board property game. One host, a table of players, and a map to discover."
  /></svelte:head
>
<main>
  <nav><a href="/rules">Rulebook</a><a href="/settings">Settings</a></nav>
  <p class="badge">A SOCIAL GAME OF HIDDEN CONNECTIONS</p>
  <h1>Own the property.<br />Discover the map.</h1>
  <p class="muted">
    One host holds the map. Players follow its paths, test their luck, and draw
    their own version of the truth.
  </p>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <div class="grid" style="margin-top:2rem">
    <section>
      <h2>Host the mystery</h2>
      <p class="muted">
        Create a room and share its number. As host, you see the real board and
        guide the game. You do not take a player seat.
      </p>
      <button disabled={busy} onclick={() => connect()}>Create a game</button>
    </section>
    <section>
      <h2>Take your seat</h2>
      <form
        onsubmit={(e) => {
          e.preventDefault();
          if (name.trim() && /^\d{6}$/.test(code.trim())) connect(true);
        }}
      >
        <label
          >Your name<input
            maxlength="32"
            autocomplete="nickname"
            placeholder="Choose a unique name"
            bind:value={name}
          /></label
        ><label
          >Room number<input
            inputmode="numeric"
            maxlength="6"
            placeholder="Six-digit number"
            bind:value={code}
          /></label
        >{#if name.trim() && /^\d{6}$/.test(code.trim())}<button disabled={busy}
            >Join game</button
          >{:else}<p class="muted">
            Enter your name and the six-digit room number to join.
          </p>{/if}
      </form>
    </section>
  </div>
</main>
