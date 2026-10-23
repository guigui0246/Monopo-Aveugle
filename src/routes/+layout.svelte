<script lang="ts">
  import '../app.css';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  let { children } = $props();
</script>

<div class="app-topbar">
  <a href="/" class="brand">MONOPO AVEUGLE</a><ThemeToggle />
</div>
{@render children()}
