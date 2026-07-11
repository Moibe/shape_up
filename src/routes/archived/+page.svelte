<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<section class="wrap">
  <a class="back" href="/">← Volver</a>
  <h1>Proyectos archivados</h1>
  <p class="lead">Proyectos ocultos del listado. Ábrelos para revisarlos o desarchivarlos.</p>

  {#if data.archived.length === 0}
    <div class="empty">
      <p>No hay proyectos archivados.</p>
    </div>
  {:else}
    <div class="list">
      {#each data.archived as p (p.id)}
        <a class="row" href="/project/{p.id}">
          <span class="name">{p.name}</span>
          <span class="meta">{p.pitchCount} pitch{p.pitchCount === 1 ? '' : 'es'}</span>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  .wrap {
    max-width: 720px;
    margin: 0 auto;
    padding: 1.5rem 0.5rem 3rem;
  }
  .back {
    display: inline-block;
    color: #2563eb;
    text-decoration: none;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }
  .back:hover {
    text-decoration: underline;
  }
  h1 {
    font-size: 1.9rem;
    font-weight: 700;
    color: #111111;
    margin: 0 0 0.3rem;
  }
  .lead {
    color: #6b7280;
    margin: 0 0 1.8rem;
    font-size: 0.95rem;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.8rem 1.1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .row:hover {
    border-color: #2563eb;
    background: #ffffff;
  }
  .name {
    font-weight: 600;
    color: #374151;
  }
  .meta {
    font-size: 0.8rem;
    color: #6b7280;
  }
  .empty {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
    background: #ffffff;
    border: 1px dashed #e5e7eb;
    border-radius: 14px;
  }
</style>
