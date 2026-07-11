<script lang="ts">
  import { enhance } from '$app/forms';
  import ViewNav from '$lib/ViewNav.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const world = $derived(data.world);
  const shaped = $derived(data.shaped);
  const seg = $derived(world.projectId === null ? 'internal' : String(world.projectId));

  const appetiteLabel = (a: string) => (a === 'small' ? 'small · 2 sem' : 'big · 6 sem');
</script>

<section class="betting">
  <div class="page-top">
    <ViewNav project={seg} />
    <a class="btn primary" href="/pitch/new?project={world.projectId ?? ''}">＋ Nuevo pitch</a>
  </div>

  <header class="head">
    <span class="eyebrow">{world.label} · betting table</span>
    <h1>¿Qué arrancamos?</h1>
    <p class="lead">Pitches shaped de este proyecto. Arrancar le da a cada uno su propio reloj (build + cooldown).</p>
  </header>

  {#if form?.betError}
    <div class="banner error" role="alert">{form.betError}</div>
  {:else if form?.startedPitchId}
    <div class="banner ok" role="status" aria-live="polite">
      Arrancado: <strong>{form.startedTitle}</strong> — build de {form.weeks} semanas.
    </div>
  {/if}

  {#if shaped.length === 0}
    <div class="empty">
      <p>No hay pitches shaped esperando.</p>
      <p class="muted">Da forma a un borrador y márcalo como <strong>Shaped</strong> para que aparezca aquí.</p>
    </div>
  {:else}
    <h2 class="list-title">Pitches shaped</h2>
    <div class="cards">
      {#each shaped as p (p.id)}
        <article class="card">
          <div class="card-top">
            <span class="appetite {p.appetite}">{appetiteLabel(p.appetite)}</span>
          </div>
          <h3><a href="/pitch/{p.id}">{p.title}</a></h3>
          <p class="problem">{p.problem}</p>
          <div class="meta">
            <span>{p.scopes.length} scope{p.scopes.length === 1 ? '' : 's'}</span>
            <span>·</span>
            <span>{p.nogos.length} no-go{p.nogos.length === 1 ? '' : 's'}</span>
          </div>
          <form method="POST" action="?/start" use:enhance class="bet-form">
            <input type="hidden" name="pitchId" value={p.id} />
            <button class="btn bet" type="submit">Arrancar ({p.appetite === 'small' ? '2' : '6'} sem)</button>
          </form>
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .betting {
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

  .banner {
    padding: 0.75rem 1rem;
    border-radius: 10px;
    margin-bottom: 1.2rem;
    font-size: 0.9rem;
  }
  .banner.error {
    background: rgba(220, 38, 38, 0.07);
    border: 1px solid rgba(220, 38, 38, 0.3);
    color: #b91c1c;
  }
  .banner.ok {
    background: rgba(22, 163, 74, 0.08);
    border: 1px solid rgba(22, 163, 74, 0.3);
    color: #15803d;
  }

  .list-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #111111;
    margin: 0 0 1rem;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }
  .card {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 1.1rem 1.2rem;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
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
  .card h3 {
    margin: 0 0 0.35rem;
    font-size: 1.05rem;
    font-weight: 600;
  }
  .card h3 a {
    color: #111111;
    text-decoration: none;
  }
  .card h3 a:hover {
    color: #2563eb;
    text-decoration: underline;
  }
  .problem {
    margin: 0 0 0.8rem;
    font-size: 0.88rem;
    line-height: 1.45;
    color: #4b5563;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .meta {
    display: flex;
    gap: 0.4rem;
    font-size: 0.78rem;
    color: #6b7280;
    margin-bottom: 1rem;
  }
  .bet-form {
    margin-top: auto;
  }
  .btn.bet {
    width: 100%;
    background: #16a34a;
    color: #ffffff;
    padding: 0.6rem 1rem;
  }
  .btn.bet:hover {
    background: #15803d;
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
