<script lang="ts">
  import ViewNav from '$lib/ViewNav.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const world = $derived(data.world);
  const seg = $derived(world.projectId === null ? 'internal' : String(world.projectId));

  const appetiteLabel = (a: string) => (a === 'small' ? 'chico · 2 sem' : 'grande · 6 sem');

  function fmt(iso: string | null) {
    if (!iso) return '—';
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  function progress(scopes: { status: string }[]) {
    const live = scopes.filter((s) => s.status !== 'cut');
    const done = live.filter((s) => s.status === 'done').length;
    return { done, total: live.length };
  }
</script>

<section class="done-view">
  <div class="page-top">
    <ViewNav project={seg} />
  </div>

  <header class="head">
    <span class="eyebrow">Terminados</span>
    <h1>Pitches terminados</h1>
    <p class="lead">El trabajo ya entregado de este proyecto.</p>
  </header>

  {#if data.done.length === 0}
    <div class="empty">
      <p>Aún no hay pitches terminados.</p>
      <p class="muted">Cuando cierres un pitch en construcción (Marcar terminado), aparecerá aquí.</p>
    </div>
  {:else}
    <div class="cards">
      {#each data.done as p (p.id)}
        {@const pr = progress(p.scopes)}
        <a class="card" href="/pitch/{p.id}">
          <div class="card-top">
            <span class="appetite {p.appetite}">{appetiteLabel(p.appetite)}</span>
            <span class="check">✓ terminado</span>
          </div>
          <h3>{p.title}</h3>
          <p class="problem">{p.problem}</p>
          <div class="foot">
            <span>{pr.done}/{pr.total} scopes</span>
            <span>·</span>
            <span>build {fmt(p.buildStartDate)} → {fmt(p.buildEndDate)}</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  .done-view {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem 0.5rem 3rem;
  }
  .page-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .head {
    margin-bottom: 1.5rem;
  }
  .eyebrow {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #16a34a;
  }
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #111111;
    margin: 0.2rem 0 0.3rem;
  }
  .lead {
    color: #6b7280;
    margin: 0;
    font-size: 0.95rem;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }
  .card {
    display: block;
    text-decoration: none;
    color: inherit;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 1.1rem 1.2rem;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
    transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
  }
  .card:hover {
    border-color: rgba(22, 163, 74, 0.45);
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.09);
    transform: translateY(-2px);
  }
  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.6rem;
  }
  .appetite {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
  }
  .appetite.small {
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.1);
    border: 1px solid rgba(37, 99, 235, 0.3);
  }
  .appetite.big {
    color: #15803d;
    background: rgba(22, 163, 74, 0.1);
    border: 1px solid rgba(22, 163, 74, 0.3);
  }
  .check {
    font-size: 0.72rem;
    font-weight: 600;
    color: #15803d;
  }
  .card h3 {
    margin: 0 0 0.35rem;
    font-size: 1.05rem;
    font-weight: 600;
    color: #111111;
  }
  .problem {
    margin: 0 0 0.9rem;
    font-size: 0.88rem;
    line-height: 1.45;
    color: #4b5563;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    font-size: 0.76rem;
    color: #6b7280;
    border-top: 1px solid #f1f5f9;
    padding-top: 0.7rem;
  }

  .empty {
    text-align: center;
    padding: 3.5rem 1rem;
    background: #ffffff;
    border: 1px dashed #e5e7eb;
    border-radius: 14px;
  }
  .empty p {
    margin: 0.2rem 0;
    color: #4b5563;
  }
  .muted {
    color: #6b7280;
    font-size: 0.9rem;
  }
</style>
