<script lang="ts">
  // Avatar generado: iniciales del usuario en un círculo con color estable
  // derivado del nombre. Sin subidas ni almacenamiento.
  import { colorFromKey } from '$lib/project-colors';

  let { username, size = 32 }: { username: string; size?: number } = $props();

  const initials = $derived.by(() => {
    const parts = username.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  });
  const color = $derived(colorFromKey(username));
</script>

<span
  class="avatar"
  style="width:{size}px;height:{size}px;background:{color};font-size:{Math.round(size * 0.4)}px"
  title={username}
  aria-hidden="true"
>
  {initials}
</span>

<style>
  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #ffffff;
    font-weight: 700;
    line-height: 1;
    flex-shrink: 0;
    letter-spacing: 0.02em;
    user-select: none;
  }
</style>
