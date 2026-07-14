<script lang="ts">
  // Navegación entre las vistas de UN proyecto (Dashboard ↔ Betting). Va dentro del
  // contenido (no en las barras). `project` es el segmento de ruta (id o 'internal').
  import { page } from '$app/state';

  let { project }: { project: string } = $props();

  const base = $derived(`/project/${project}`);
  const path = $derived(page.url.pathname);
  const onDrafts = $derived(path.endsWith('/drafts'));
  const onBetting = $derived(path.endsWith('/betting'));
  const onDone = $derived(path.endsWith('/done'));
  const onDashboard = $derived(!onDrafts && !onBetting && !onDone);
</script>

<nav class="view-nav">
  <a href="{base}/drafts" class="tab" aria-current={onDrafts ? 'page' : undefined}>Borradores</a>
  <a href="{base}/betting" class="tab" aria-current={onBetting ? 'page' : undefined}>Betting table</a>
  <a href={base} class="tab" aria-current={onDashboard ? 'page' : undefined}>Dashboard</a>
  <a href="{base}/done" class="tab" aria-current={onDone ? 'page' : undefined}>Terminados</a>
</nav>

<style>
  .view-nav {
    display: inline-flex;
    gap: 0.25rem;
    padding: 0.25rem;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
  }
  .tab {
    font-size: 0.85rem;
    font-weight: 600;
    color: #4b5563;
    text-decoration: none;
    padding: 0.4rem 0.9rem;
    border-radius: 7px;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .tab:hover {
    color: #111111;
  }
  .tab[aria-current='page'] {
    color: #1d4ed8;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  }
</style>
