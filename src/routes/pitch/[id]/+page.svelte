<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { confirmAndSubmit } from '$lib/confirm.svelte';
  import HillChart from '$lib/HillChart.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const pitch = $derived(data.pitch);
  const clock = $derived(data.clock);
  // Ruta del mundo (proyecto) al que pertenece el pitch, para el enlace de volver.
  const projectSeg = $derived(pitch.projectId === null ? 'internal' : String(pitch.projectId));
  // Scopes vivos (no cortados) para el hill chart.
  const hillScopes = $derived(pitch.scopes.filter((s) => s.status !== 'cut'));

  let editingScopeId = $state<number | null>(null);

  // Persistir la posición del dot al soltar (o con flechas) y refrescar.
  async function persistHill(scopeId: number, pos: number) {
    const fd = new FormData();
    fd.set('scopeId', String(scopeId));
    fd.set('hillPosition', String(pos));
    await fetch('?/setHill', {
      method: 'POST',
      body: fd,
      headers: { 'x-sveltekit-action': 'true' }
    });
    await invalidateAll();
  }

  const appetiteLabel = (a: string) => (a === 'small' ? 'small · 2 sem' : 'big · 6 sem');

  const statusLabel: Record<string, string> = {
    draft: 'Borrador',
    shaped: 'Shaped',
    building: 'En construcción',
    done: 'Terminado',
    rejected: 'Rechazado'
  };

  function fmt(iso: string | null) {
    if (!iso) return '—';
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  function clockText(c: { phase: string; daysLeft: number } | null) {
    if (!c) return '';
    if (c.phase === 'building') return `${c.daysLeft} ${c.daysLeft === 1 ? 'día' : 'días'} de build restantes`;
    if (c.phase === 'cooldown') return `en cooldown · ${c.daysLeft} ${c.daysLeft === 1 ? 'día' : 'días'}`;
    return 'cooldown terminó — por cerrar';
  }

  const scopeStatusLabel: Record<string, string> = {
    uphill: 'Subiendo',
    downhill: 'Bajando',
    done: 'Hecho',
    cut: 'Cortado'
  };

  // Mini-parser de Markdown para el modelo de datos (MVP: ##, - y párrafos). Se
  // parsea a estructura y se renderiza con marcado propio — sin @html.
  type Block = { type: 'h' | 'p'; text: string } | { type: 'ul'; items: string[] };
  function parseMarkdown(md: string | null): Block[] {
    if (!md) return [];
    const blocks: Block[] = [];
    let list: string[] | null = null;
    for (const raw of md.split('\n')) {
      const line = raw.trimEnd();
      if (line.startsWith('- ')) {
        (list ??= []).push(line.slice(2));
        continue;
      }
      if (list) {
        blocks.push({ type: 'ul', items: list });
        list = null;
      }
      if (!line.trim()) continue;
      if (line.startsWith('#')) blocks.push({ type: 'h', text: line.replace(/^#+\s*/, '') });
      else blocks.push({ type: 'p', text: line });
    }
    if (list) blocks.push({ type: 'ul', items: list });
    return blocks;
  }

  const dataModelBlocks = $derived(parseMarkdown(pitch.dataModel));

  function bold(text: string) {
    return text
      .split(/(\*\*[^*]+\*\*)/g)
      .map((seg) =>
        seg.startsWith('**') && seg.endsWith('**')
          ? { strong: true, text: seg.slice(2, -2) }
          : { strong: false, text: seg }
      );
  }
</script>

<article class="pitch">
  <div class="topbar">
    <a class="back" href="/project/{projectSeg}">← Volver al dashboard</a>
    <a class="btn ghost" href="/pitch/{pitch.id}/edit">Editar pitch</a>
  </div>

  <header class="head">
    <div class="badges">
      <span class="badge status {pitch.status}">{statusLabel[pitch.status]}</span>
      <span class="badge appetite {pitch.appetite}">{appetiteLabel(pitch.appetite)}</span>
      {#if pitch.project}<span class="badge project">{pitch.project.name}</span>{/if}
    </div>
    <h1>{pitch.title}</h1>
  </header>

  {#if pitch.status === 'building'}
    <section class="clock-box" class:cooldown={clock?.phase === 'cooldown'} class:ended={clock?.phase === 'ended'}>
      <div class="clock-info">
        <span class="clock-phase">{clockText(clock)}</span>
        <span class="clock-dates">
          build {fmt(pitch.buildStartDate)} → {fmt(pitch.buildEndDate)} · cooldown hasta {fmt(pitch.cooldownEndDate)}
        </span>
      </div>
      <form method="POST" action="?/finish" use:enhance>
        <button class="btn primary" type="submit">Marcar terminado</button>
      </form>
    </section>
  {/if}

  <section class="block">
    <h2>Problema</h2>
    <p>{pitch.problem}</p>
  </section>

  {#if pitch.solutionSketch}
    <section class="block">
      <h2>Solution sketch</h2>
      <p class="sketch">{pitch.solutionSketch}</p>
    </section>
  {/if}

  {#if dataModelBlocks.length}
    <section class="block">
      <h2>Modelo de datos</h2>
      <div class="data-model">
        {#each dataModelBlocks as b}
          {#if b.type === 'h'}
            <h3>{b.text}</h3>
          {:else if b.type === 'ul'}
            <ul>
              {#each b.items as it}
                <li>{#each bold(it) as seg}{#if seg.strong}<strong>{seg.text}</strong>{:else}{seg.text}{/if}{/each}</li>
              {/each}
            </ul>
          {:else}
            <p>{b.text}</p>
          {/if}
        {/each}
      </div>
    </section>
  {/if}

  <section class="block">
    <h2>No-Gos</h2>
    {#if pitch.nogos.length === 0}
      <p class="muted">Sin no-gos declarados.</p>
    {:else}
      <ul class="nogos">
        {#each pitch.nogos as n (n.id)}
          <li>
            <span class="x">✕</span>
            <span class="nogo-text">{n.text}</span>
            <form method="POST" action="?/deleteNogo" use:enhance>
              <input type="hidden" name="nogoId" value={n.id} />
              <button class="mini danger" type="submit">Quitar</button>
            </form>
          </li>
        {/each}
      </ul>
    {/if}
    <form method="POST" action="?/addNogo" class="add-row" use:enhance>
      <input type="text" name="text" placeholder="Nuevo no-go…" />
      <button class="mini primary" type="submit">Agregar</button>
    </form>
    {#if form?.nogoError}<span class="err">{form.nogoError}</span>{/if}
  </section>

  <section class="block">
    <h2>Scopes</h2>
    {#if hillScopes.length > 0}
      <HillChart scopes={hillScopes} onmove={persistHill} />
    {/if}
    {#if pitch.scopes.length === 0}
      <p class="muted">Sin scopes todavía.</p>
    {:else}
      <ul class="scopes">
        {#each pitch.scopes as s (s.id)}
          <li class:cut={s.status === 'cut'}>
            {#if editingScopeId === s.id}
              <form
                method="POST"
                action="?/updateScope"
                class="scope-edit"
                use:enhance={() => async ({ update }) => {
                  await update();
                  editingScopeId = null;
                }}
              >
                <input type="hidden" name="scopeId" value={s.id} />
                <input class="grow" type="text" name="name" value={s.name} />
                <label class="chk"><input type="checkbox" name="isCore" checked={s.isCore} /> core</label>
                <input class="sort" type="number" name="sortOrder" value={s.sortOrder} min="0" />
                <button class="mini primary" type="submit">Guardar</button>
                <button class="mini ghost" type="button" onclick={() => (editingScopeId = null)}>Cancelar</button>
              </form>
            {:else}
              <div class="scope-row1">
                <span class="scope-name">{s.name}</span>
                <span class="tags">
                  <span class="tag {s.isCore ? 'core' : 'nice'}">{s.isCore ? 'core' : 'nice-to-have'}</span>
                  <span class="tag st {s.status}">{scopeStatusLabel[s.status]}</span>
                </span>
              </div>
              <div class="hill">
                <span class="crest"></span>
                <span class="dot" class:core={s.isCore} style="left: {s.hillPosition}%"></span>
              </div>
              <div class="scope-actions">
                <span class="hill-num">loma {s.hillPosition}</span>
                <button class="mini ghost" type="button" onclick={() => (editingScopeId = s.id)}>Editar</button>
                {#if s.status === 'cut'}
                  <form method="POST" action="?/restoreScope" use:enhance>
                    <input type="hidden" name="scopeId" value={s.id} />
                    <button class="mini ghost" type="submit">Restaurar</button>
                  </form>
                {:else}
                  <form method="POST" action="?/cutScope" use:enhance>
                    <input type="hidden" name="scopeId" value={s.id} />
                    <button class="mini warn" type="submit">Cortar</button>
                  </form>
                {/if}
                <form method="POST" action="?/deleteScope" use:enhance>
                  <input type="hidden" name="scopeId" value={s.id} />
                  <button
                    class="mini danger"
                    type="button"
                    onclick={(e) =>
                      confirmAndSubmit(e.currentTarget, {
                        title: 'Borrar scope',
                        message: `¿Borrar el scope "${s.name}"?`,
                        confirmLabel: 'Borrar',
                        variant: 'danger'
                      })}
                  >
                    Borrar
                  </button>
                </form>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
    <form method="POST" action="?/addScope" class="add-row" use:enhance>
      <input type="text" name="name" placeholder="Nuevo scope…" />
      <label class="chk"><input type="checkbox" name="isCore" checked /> core</label>
      <button class="mini primary" type="submit">Agregar</button>
    </form>
    {#if form?.scopeError}<span class="err">{form.scopeError}</span>{/if}
  </section>
</article>

<style>
  .pitch {
    max-width: 760px;
    margin: 0 auto;
    padding: 1.5rem 0.5rem 3rem;
  }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  .back {
    color: #2563eb;
    text-decoration: none;
    font-size: 0.85rem;
  }
  .back:hover {
    text-decoration: underline;
  }
  .head {
    margin-bottom: 2rem;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.6rem;
  }
  .badge {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    color: #4b5563;
    background: #f9fafb;
  }
  .badge.appetite.small,
  .badge.status.building {
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.1);
    border-color: rgba(37, 99, 235, 0.3);
  }
  .badge.appetite.big,
  .badge.status.shaped {
    color: #15803d;
    background: rgba(22, 163, 74, 0.1);
    border-color: rgba(22, 163, 74, 0.3);
  }
  h1 {
    font-size: 1.9rem;
    font-weight: 700;
    color: #111111;
    margin: 0;
  }
  .block {
    margin-bottom: 1.8rem;
  }
  .block h2 {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #16a34a;
    margin: 0 0 0.6rem;
  }
  .block > p {
    margin: 0;
    line-height: 1.6;
    color: #1f2937;
  }
  .sketch {
    color: #4b5563;
    font-style: italic;
  }
  .muted {
    color: #6b7280;
  }

  .data-model {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1rem 1.2rem;
  }
  .data-model h3 {
    font-size: 0.95rem;
    margin: 0 0 0.5rem;
    color: #111111;
  }
  .data-model ul {
    margin: 0;
    padding-left: 1.1rem;
  }
  .data-model li {
    line-height: 1.7;
    color: #1f2937;
  }

  .nogos {
    list-style: none;
    margin: 0 0 0.8rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .nogos li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #4b5563;
  }
  .nogos .x {
    color: #dc2626;
    font-weight: 700;
  }
  .nogo-text {
    flex: 1;
  }

  .scopes {
    list-style: none;
    margin: 0 0 0.8rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }
  .scopes li {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.9rem 1.1rem;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
  }
  .scopes li.cut {
    opacity: 0.55;
  }
  .scopes li.cut .scope-name {
    text-decoration: line-through;
  }
  .scope-row1 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
  }
  .scope-name {
    font-weight: 600;
    color: #111111;
  }
  .tags {
    display: flex;
    gap: 0.35rem;
  }
  .tag {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    white-space: nowrap;
  }
  .tag.core {
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.08);
    border-color: rgba(37, 99, 235, 0.25);
  }
  .tag.nice {
    color: #15803d;
    background: rgba(22, 163, 74, 0.08);
    border-color: rgba(22, 163, 74, 0.25);
  }
  .hill {
    position: relative;
    height: 18px;
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
    width: 12px;
    height: 12px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: #86efac;
    border: 2px solid #ffffff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
  }
  .dot.core {
    background: #2563eb;
  }
  .scope-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .hill-num {
    font-size: 0.78rem;
    color: #6b7280;
    font-variant-numeric: tabular-nums;
    margin-right: auto;
  }

  .scope-edit {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .scope-edit .grow {
    flex: 1;
    min-width: 160px;
  }
  .scope-edit .sort {
    width: 68px;
  }

  /* Inputs de las filas inline (agregar / editar). */
  .add-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .add-row input[type='text'] {
    flex: 1;
    min-width: 160px;
  }
  input[type='text'],
  input[type='number'] {
    font: inherit;
    color: #111111;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.45rem 0.6rem;
    box-sizing: border-box;
  }
  input[type='text']:focus,
  input[type='number']:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
  .chk {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.82rem;
    color: #374151;
    white-space: nowrap;
  }
  .chk input {
    accent-color: #2563eb;
  }

  .mini {
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.4rem 0.7rem;
    border-radius: 7px;
    border: 1px solid transparent;
    cursor: pointer;
    white-space: nowrap;
  }
  .mini.primary {
    background: #2563eb;
    color: #ffffff;
  }
  .mini.primary:hover {
    background: #1d4ed8;
  }
  .mini.ghost {
    background: transparent;
    border-color: #d1d5db;
    color: #374151;
  }
  .mini.ghost:hover {
    border-color: #9ca3af;
  }
  .mini.warn {
    background: rgba(234, 88, 12, 0.08);
    border-color: rgba(234, 88, 12, 0.35);
    color: #c2410c;
  }
  .mini.warn:hover {
    background: rgba(234, 88, 12, 0.15);
  }
  .mini.danger {
    background: transparent;
    border-color: rgba(220, 38, 38, 0.35);
    color: #dc2626;
  }
  .mini.danger:hover {
    background: rgba(220, 38, 38, 0.06);
  }

  .clock-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 0.9rem 1.2rem;
    margin-bottom: 1.8rem;
    border-radius: 12px;
    background: rgba(37, 99, 235, 0.06);
    border: 1px solid rgba(37, 99, 235, 0.25);
  }
  .clock-box.cooldown {
    background: rgba(245, 158, 11, 0.09);
    border-color: rgba(245, 158, 11, 0.3);
  }
  .clock-box.ended {
    background: rgba(107, 114, 128, 0.09);
    border-color: rgba(107, 114, 128, 0.3);
  }
  .clock-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .clock-phase {
    font-weight: 700;
    color: #111111;
  }
  .clock-dates {
    font-size: 0.8rem;
    color: #4b5563;
  }

  .btn {
    font: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.45rem 0.9rem;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    cursor: pointer;
    text-decoration: none;
    color: #374151;
    background: transparent;
  }
  .btn.ghost:hover {
    border-color: #2563eb;
    color: #2563eb;
  }
  .btn.primary {
    background: #2563eb;
    border-color: #2563eb;
    color: #ffffff;
  }
  .btn.primary:hover {
    background: #1d4ed8;
  }

  .err {
    display: block;
    margin-top: 0.4rem;
    font-size: 0.78rem;
    color: #dc2626;
  }
</style>
