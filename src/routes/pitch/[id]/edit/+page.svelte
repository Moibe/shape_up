<script lang="ts">
  import { enhance } from '$app/forms';
  import { confirmAndSubmit } from '$lib/confirm.svelte';
  import PitchFields from '$lib/PitchFields.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const pitch = $derived(data.pitch);
  const values = $derived(form?.values ?? data.values);

  const statusLabel: Record<string, string> = {
    draft: 'Borrador',
    shaped: 'Shaped',
    building: 'En construcción',
    rejected: 'Rechazado',
    done: 'Terminado'
  };
  const locked = $derived(pitch.status === 'building' || pitch.status === 'done');
</script>

<div class="wrap">
  <a class="back" href="/pitch/{pitch.id}">← Volver al pitch</a>
  <h1>Editar pitch</h1>

  <form method="POST" action="?/update" use:enhance>
    <PitchFields projects={data.projects} {values} errors={form?.errors ?? {}} />

    <div class="field">
      <span class="label">Estado</span>
      {#if locked}
        <p class="bet-note">
          <strong>{statusLabel[pitch.status]}</strong> — el estado se gestiona desde el pitch
          (Arrancar / Marcar terminado), no aquí.
        </p>
      {:else}
        <select name="status" class="status-sel">
          {#each data.editableStatuses as s}
            <option value={s} selected={pitch.status === s}>{statusLabel[s]}</option>
          {/each}
        </select>
        <span class="hint">Pásalo a <strong>Shaped</strong> para que entre a la betting table.</span>
      {/if}
    </div>

    <div class="actions">
      <a class="btn ghost" href="/pitch/{pitch.id}">Cancelar</a>
      <button class="btn primary" type="submit">Guardar cambios</button>
    </div>
  </form>

  <form method="POST" action="?/delete" class="delete-form" use:enhance>
    <button
      class="btn danger"
      type="button"
      onclick={(e) =>
        confirmAndSubmit(e.currentTarget, {
          title: 'Borrar pitch',
          message: `¿Borrar "${pitch.title}"? Se eliminan también sus scopes y no-gos. No se puede deshacer.`,
          confirmLabel: 'Borrar',
          variant: 'danger'
        })}
    >
      Borrar pitch
    </button>
  </form>
</div>

<style>
  .wrap {
    max-width: 640px;
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
    margin: 0 0 1.8rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1.1rem;
  }
  .label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #111111;
  }
  .hint {
    font-size: 0.8rem;
    color: #6b7280;
  }
  .status-sel {
    font: inherit;
    color: #111111;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.55rem 0.7rem;
    max-width: 260px;
  }
  .status-sel:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
  .bet-note {
    margin: 0;
    padding: 0.6rem 0.8rem;
    background: rgba(37, 99, 235, 0.06);
    border: 1px solid rgba(37, 99, 235, 0.25);
    border-radius: 8px;
    color: #374151;
    font-size: 0.88rem;
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
    transition: background 0.15s ease, border-color 0.15s ease;
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
  .delete-form {
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #f1f5f9;
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
</style>
