<script lang="ts">
  import { enhance } from '$app/forms';
  import ViewNav from '$lib/ViewNav.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const world = $derived(data.world);
  const building = $derived(data.building);
  const seg = $derived(world.projectId === null ? 'internal' : String(world.projectId));

  let editingName = $state(false);

  const appetiteLabel = (a: string) => (a === 'small' ? 'small · 2 sem' : 'big · 6 sem');

  function progress(scopes: { status: string }[]) {
    const live = scopes.filter((s) => s.status !== 'cut');
    const done = live.filter((s) => s.status === 'done').length;
    return { done, total: live.length };
  }

  // Texto del reloj derivado por pitch.
  function clockText(clock: { phase: string; daysLeft: number } | null) {
    if (!clock) return '';
    if (clock.phase === 'building')
      return `${clock.daysLeft} ${clock.daysLeft === 1 ? 'día' : 'días'} de build`;
    if (clock.phase === 'cooldown')
      return `cooldown · ${clock.daysLeft} ${clock.daysLeft === 1 ? 'día' : 'días'}`;
    return 'cooldown terminó';
  }
</script>

<section class="dash">
  <div class="page-top">
    <ViewNav project={seg} />
    <div class="top-actions">
      <a class="btn primary" href="/pitch/new?project={world.projectId ?? ''}">＋ Nuevo pitch</a>
      {#if world.projectId !== null}
        <a class="btn ghost" href="/project/{seg}/settings">⚙ Ajustes</a>
      {/if}
    </div>
  </div>

  {#if world.project?.archived}
    <div class="archived-banner">
      <span>Este proyecto está <strong>archivado</strong> — oculto del listado.</span>
      <form method="POST" action="?/unarchive" use:enhance>
        <button class="btn primary sm" type="submit">Desarchivar</button>
      </form>
    </div>
  {/if}

  <header class="head">
    <span class="eyebrow">Proyecto</span>
    {#if editingName && world.projectId !== null}
      <form
        method="POST"
        action="?/rename"
        class="rename-form"
        use:enhance={() => {
          return async ({ update }) => {
            await update();
            editingName = false;
          };
        }}
      >
        <!-- svelte-ignore a11y_autofocus -->
        <input name="name" value={world.label} aria-label="Nombre del proyecto" autofocus />
        <button class="btn primary sm" type="submit">Guardar</button>
        <button class="btn ghost sm" type="button" onclick={() => (editingName = false)}>Cancelar</button>
      </form>
    {:else}
      <h1>
        {world.label}
        {#if world.projectId !== null}
          <button class="edit-name" type="button" onclick={() => (editingName = true)} aria-label="Editar nombre">✎</button>
        {/if}
      </h1>
    {/if}
    {#if form?.renameError}<span class="err" role="alert">{form.renameError}</span>{/if}
    <p class="sub">{building.length} en curso · {data.drafts.length} en preparación</p>
  </header>

  <h2 class="section-title">En curso</h2>
  {#if building.length === 0}
    <div class="empty small">
      <p>Nada en construcción. Arranca un pitch shaped desde la <a href="/project/{seg}/betting">betting table</a>.</p>
    </div>
  {:else}
    <div class="cards">
      {#each building as p (p.id)}
        {@const pr = progress(p.scopes)}
        <a class="card" href="/pitch/{p.id}">
          <div class="card-top">
            <span class="appetite {p.appetite}">{appetiteLabel(p.appetite)}</span>
            {#if p.clock}
              <span class="clock {p.clock.phase}" class:urgent={p.clock.phase === 'building' && p.clock.daysLeft <= 5}>
                {clockText(p.clock)}
              </span>
            {/if}
          </div>
          <h3>{p.title}</h3>
          <p class="problem">{p.problem}</p>
          <div class="scopes">
            <span class="scope-count">{pr.done}/{pr.total} scopes</span>
            <div class="dots">
              {#each p.scopes.filter((s) => s.status !== 'cut') as s (s.id)}
                <span class="dot" class:core={s.isCore} style="left: {s.hillPosition}%" title="{s.name} · {s.hillPosition}"></span>
              {/each}
              <span class="crest"></span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}

  {#if data.drafts.length > 0}
    <section class="drafts">
      <h2 class="section-title">Borradores en preparación</h2>
      <div class="draft-list">
        {#each data.drafts as d (d.id)}
          <a class="draft" href="/pitch/{d.id}">
            <span class="draft-title">{d.title}</span>
            <span class="draft-meta">{d.appetite === 'small' ? 'small' : 'big'}</span>
          </a>
        {/each}
      </div>
    </section>
  {/if}
</section>

<style>
  .dash {
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

  .archived-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    border-radius: 10px;
    background: rgba(107, 114, 128, 0.08);
    border: 1px solid rgba(107, 114, 128, 0.3);
    color: #374151;
    font-size: 0.9rem;
  }
  .head {
    margin-bottom: 2rem;
  }
  .eyebrow {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #16a34a;
  }
  .top-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #111111;
    margin: 0.2rem 0 0.3rem;
  }
  .edit-name {
    font-size: 1rem;
    background: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.1rem 0.3rem;
    border-radius: 6px;
    vertical-align: middle;
  }
  .edit-name:hover {
    color: #2563eb;
    background: rgba(37, 99, 235, 0.08);
  }
  .rename-form {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin: 0.2rem 0 0.3rem;
  }
  .rename-form input {
    font: inherit;
    font-size: 1.6rem;
    font-weight: 700;
    color: #111111;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.2rem 0.5rem;
    min-width: 240px;
    flex: 1;
  }
  .rename-form input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
  .btn.sm {
    padding: 0.45rem 0.9rem;
    font-size: 0.85rem;
  }
  .btn.ghost {
    background: transparent;
    border-color: #d1d5db;
    color: #374151;
  }
  .btn.ghost:hover {
    border-color: #9ca3af;
  }
  .err {
    display: block;
    font-size: 0.8rem;
    color: #dc2626;
    margin: 0.2rem 0;
  }
  .sub {
    color: #6b7280;
    margin: 0;
    font-size: 0.95rem;
  }

  .section-title {
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
    border-color: rgba(37, 99, 235, 0.45);
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
  .clock {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.08);
    border: 1px solid rgba(37, 99, 235, 0.2);
  }
  .clock.cooldown {
    color: #b45309;
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
  }
  .clock.ended {
    color: #4b5563;
    background: rgba(107, 114, 128, 0.1);
    border-color: rgba(107, 114, 128, 0.3);
  }
  .clock.urgent {
    color: #c2410c;
    background: rgba(234, 88, 12, 0.1);
    border-color: rgba(234, 88, 12, 0.35);
  }
  .card h3 {
    margin: 0 0 0.35rem;
    font-size: 1.05rem;
    font-weight: 600;
    color: #111111;
  }
  .problem {
    margin: 0 0 1rem;
    font-size: 0.88rem;
    line-height: 1.45;
    color: #4b5563;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .scopes {
    border-top: 1px solid #f1f5f9;
    padding-top: 0.7rem;
  }
  .scope-count {
    font-size: 0.75rem;
    color: #6b7280;
  }
  .dots {
    position: relative;
    height: 20px;
    margin-top: 0.5rem;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(37, 99, 235, 0.1), rgba(22, 163, 74, 0.1));
  }
  .crest {
    position: absolute;
    left: 50%;
    top: -2px;
    bottom: -2px;
    width: 1px;
    background: rgba(17, 17, 17, 0.15);
  }
  .dot {
    position: absolute;
    top: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: #86efac;
    border: 1.5px solid #ffffff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
  }
  .dot.core {
    background: #2563eb;
  }

  .empty.small {
    padding: 2rem 1rem;
    background: #ffffff;
    border: 1px dashed #e5e7eb;
    border-radius: 14px;
    text-align: center;
    color: #6b7280;
  }
  .empty.small a {
    color: #2563eb;
  }

  .drafts {
    margin-top: 2.5rem;
  }
  .draft-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .draft {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem 1rem;
    background: #ffffff;
    border: 1px dashed #d1d5db;
    border-radius: 10px;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s ease;
  }
  .draft:hover {
    border-color: #2563eb;
    border-style: solid;
  }
  .draft-title {
    font-weight: 600;
    color: #111111;
  }
  .draft-meta {
    font-size: 0.8rem;
    color: #6b7280;
  }
</style>
