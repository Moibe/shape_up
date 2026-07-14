<script lang="ts">
  import ViewNav from '$lib/ViewNav.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const world = $derived(data.world);
  const seg = $derived(world.projectId === null ? 'internal' : String(world.projectId));
  const isAdmin = $derived(data.user?.isAdmin ?? false);

  const appetiteLabel = (a: string) => (a === 'small' ? 'chico · 2 sem' : 'grande · 6 sem');
</script>

<section class="drafts-view">
  <div class="page-top">
    <ViewNav project={seg} />
    {#if isAdmin}
      <a class="btn primary" href="/pitch/new?project={world.projectId ?? ''}">＋ Nuevo pitch</a>
    {/if}
  </div>

  <header class="head">
    <span class="eyebrow">Borradores</span>
    <h1>Borradores</h1>
    <p class="lead">Pitches en preparación (shaping). Cuando estén listos, pásalos a <strong>Shaped</strong> para que entren a la betting table.</p>
  </header>

  {#if data.drafts.length === 0}
    <div class="empty">
      <p>No hay borradores.</p>
      <p class="muted">
        {#if isAdmin}Crea un pitch (nace como borrador) y dale forma aquí.{:else}Aún no hay pitches en preparación.{/if}
      </p>
    </div>
  {:else}
    <div class="cards">
      {#each data.drafts as p (p.id)}
        <a class="card" href="/pitch/{p.id}">
          <div class="card-top">
            <span class="appetite {p.appetite}">{appetiteLabel(p.appetite)}</span>
          </div>
          <h3>{p.title}</h3>
          <p class="problem">{p.problem}</p>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  .drafts-view {
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
  .btn {
    font: inherit;
    font-weight: 600;
    font-size: 0.9rem;
    padding: 0.55rem 1.1rem;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    text-decoration: none;
  }
  .btn.primary {
    background: #2563eb;
    color: #ffffff;
  }
  .btn.primary:hover {
    background: #1d4ed8;
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
    max-width: 52ch;
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
    border: 1px dashed #d1d5db;
    border-radius: 14px;
    padding: 1.1rem 1.2rem;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
    transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
  }
  .card:hover {
    border-color: #2563eb;
    border-style: solid;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
    transform: translateY(-2px);
  }
  .card-top {
    margin-bottom: 0.5rem;
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
  .card h3 {
    margin: 0 0 0.35rem;
    font-size: 1.05rem;
    font-weight: 600;
    color: #111111;
  }
  .problem {
    margin: 0;
    font-size: 0.88rem;
    line-height: 1.45;
    color: #4b5563;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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
