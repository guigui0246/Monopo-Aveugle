<script lang="ts">
  import { AVATARS } from '$lib/game/appearance';
  import type { Action } from '$lib/game/types';
  let {
    player,
    save,
  }: { player: { avatar: string; color: string }; save: (a: Action) => void } =
    $props();
  let avatar = $state('');
  let color = $state('');
  let loadedProfile = '';
  $effect(() => {
    const profile = `${player.avatar}:${player.color}`;
    if (profile !== loadedProfile) {
      loadedProfile = profile;
      avatar = player.avatar;
      color = player.color;
    }
  });
</script>

<details class="avatar-editor">
  <summary>Customize your avatar</summary><label
    >Avatar<select bind:value={avatar}
      >{#each AVATARS as option}<option value={option}>{option}</option
        >{/each}</select
    ></label
  ><label>Player color<input type="color" bind:value={color} /></label
  >{#if avatar !== player.avatar || color !== player.color}<button
      onclick={() => save({ type: 'profile', avatar, color })}
      >Save avatar</button
    >{/if}
</details>
