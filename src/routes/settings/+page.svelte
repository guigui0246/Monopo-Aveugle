<script lang="ts">
  import { onMount } from 'svelte';
  let language = $state('en');
  onMount(() => {
    language = localStorage.getItem('language') ?? 'en';
  });
</script>

<main>
  <nav><a href="/">← Play</a></nav>
  <h1>Language</h1>
  <section>
    <label
      >Interface language<select
        bind:value={language}
        onchange={() => localStorage.setItem('language', language)}
        ><option value="en">English</option></select
      ></label
    >
    <p class="muted">English is currently available.</p>
  </section>
</main>
