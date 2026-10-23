<script lang="ts">
  let {
    avatar,
    color,
    size = 18,
  }: { avatar: string; color: string; size?: number } = $props();
</script>

<g
  ><circle
    r={size}
    fill="var(--surface)"
    stroke={color}
    stroke-width="4"
  /><text
    text-anchor="middle"
    dominant-baseline="central"
    font-size={size * 1.25}>{avatar}</text
  ></g
>
