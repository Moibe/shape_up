<script lang="ts">
  import { enhance } from '$app/forms';
  import { openAlert, confirmAndSubmit } from '$lib/confirm.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const project = $derived(data.project);

  async function onDelete(el: HTMLElement) {
    if (data.pitchCount > 0) {
      await openAlert({
        title: 'No se puede borrar todavía',
        message: `Este proyecto tiene ${data.pitchCount} pitch${data.pitchCount === 1 ? '' : 'es'}. Bórralos primero, o usa Archivar (reversible).`,
        variant: 'warn'
      });
      return;
    }
    await confirmAndSubmit(el, {
      title: 'Borrar proyecto',
      message: `¿Borrar "${project.name}"? Es permanente, no se puede deshacer.`,
      confirmLabel: 'Borrar',
      variant: 'danger'
    });
  }
</script>

<div class="wrap">
  <a class="back" href="/project/{project.id}">← Volver al dashboard</a>
  <h1>Ajustes de proyecto</h1>

  <form method="POST" action="?/rename" use:enhance>
    <div class="field">
      <label for="name">Nombre</label>
      <input id="name" name="name" type="text" value={project.name} />
      {#if form?.nameError}<span class="err" role="alert">{form.nameError}</span>{/if}
    </div>
    <div class="field">
      <label for="notes">Notas <span class="hint">(opcional)</span></label>
      <textarea id="notes" name="notes" rows="3">{project.notes ?? ''}</textarea>
    </div>
    <div class="actions">
      <a class="btn ghost" href="/project/{project.id}">Cancelar</a>
      <button class="btn primary" type="submit">Guardar</button>
    </div>
  </form>

  <div class="danger-zone">
    <h2>Archivar o borrar</h2>
    <div class="dz-actions">
      <form method="POST" action="?/archive" use:enhance>
        <button
          class="btn warn"
          type="button"
          onclick={(e) =>
            confirmAndSubmit(e.currentTarget, {
              title: 'Archivar proyecto',
              message: `¿Archivar "${project.name}"? Se oculta del listado; podrás recuperarlo cuando quieras.`,
              confirmLabel: 'Archivar',
              variant: 'warn'
            })}
        >
          Archivar proyecto
        </button>
      </form>
      <form method="POST" action="?/delete" use:enhance>
        <button class="btn danger" type="button" onclick={(e) => onDelete(e.currentTarget)}>
          Borrar proyecto
        </button>
      </form>
    </div>

    {#if data.pitchCount > 0}
      <p class="dz-hint">
        <strong>Borrar</strong> requiere que el proyecto esté vacío: primero borra sus {data.pitchCount}
        pitch{data.pitchCount === 1 ? '' : 'es'}, o usa <strong>Archivar</strong> (reversible).
      </p>
    {:else}
      <p class="dz-hint"><strong>Archivar</strong> lo oculta (reversible). <strong>Borrar</strong> es permanente.</p>
    {/if}
    {#if form?.deleteError}<span class="err" role="alert">{form.deleteError}</span>{/if}
  </div>
</div>

<style>
  .wrap {
    max-width: 560px;
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
    font-size: 1.8rem;
    font-weight: 700;
    color: #111111;
    margin: 0 0 1.5rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1.1rem;
  }
  label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #111111;
  }
  .hint {
    font-weight: 400;
    color: #9ca3af;
  }
  input[type='text'],
  textarea {
    font: inherit;
    color: #111111;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.55rem 0.7rem;
    width: 100%;
    box-sizing: border-box;
  }
  input[type='text']:focus,
  textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
  textarea {
    resize: vertical;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    margin-top: 1.5rem;
  }
  .btn {
    font: inherit;
    font-weight: 600;
    padding: 0.6rem 1.2rem;
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
  .btn.ghost {
    background: transparent;
    border-color: #d1d5db;
    color: #374151;
  }
  .btn.ghost:hover {
    border-color: #9ca3af;
  }
  .btn.danger {
    background: transparent;
    border-color: rgba(220, 38, 38, 0.4);
    color: #dc2626;
  }
  .btn.danger:hover {
    background: rgba(220, 38, 38, 0.06);
    border-color: #dc2626;
  }
  .danger-zone {
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #f1f5f9;
  }
  .danger-zone h2 {
    font-size: 1rem;
    font-weight: 700;
    color: #b91c1c;
    margin: 0 0 0.8rem;
  }
  .dz-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .dz-actions .btn {
    padding: 0.35rem 0.75rem;
    font-size: 0.82rem;
    font-weight: 500;
  }
  .btn.warn {
    background: transparent;
    border-color: rgba(234, 88, 12, 0.4);
    color: #c2410c;
  }
  .btn.warn:hover {
    background: rgba(234, 88, 12, 0.07);
    border-color: #ea580c;
  }
  .dz-hint {
    color: #6b7280;
    font-size: 0.85rem;
    margin: 0.8rem 0 0;
  }
  .err {
    display: block;
    margin-top: 0.4rem;
    font-size: 0.78rem;
    color: #dc2626;
  }
</style>
