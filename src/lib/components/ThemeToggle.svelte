<script lang="ts">
  import { onMount } from 'svelte';
  let dark = $state(false);
  onMount(() => {
    dark = document.documentElement.dataset.theme === 'dark';
  });
  function toggle() {
    dark = !dark;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {}
  }
</script>

<button
  class="theme-toggle"
  onclick={toggle}
  aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
  >{dark ? '☀ Light mode' : '☾ Dark mode'}</button
>
