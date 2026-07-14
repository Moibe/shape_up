<script lang="ts">
  import { enhance } from '$app/forms';
  import PitchFields from '$lib/PitchFields.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let submitting = $state(false);
</script>

<div class="wrap">
  <a class="back" href="/project/{data.project.id}">← Volver al proyecto</a>
  <h1>Nuevo pitch</h1>
  <p class="lead">
    En <strong>{data.project.name}</strong>. Se crea como borrador; cuando esté shaped, entra a la betting table.
  </p>

  <form
    method="POST"
    use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        await update();
        submitting = false;
      };
    }}
  >
    <input type="hidden" name="projectId" value={data.project.id} />
    <PitchFields values={form?.values ?? {}} errors={form?.errors ?? {}} />
    <div class="actions">
      <a class="btn ghost" href="/project/{data.project.id}">Cancelar</a>
      <button class="btn primary" type="submit" disabled={submitting}>Crear pitch</button>
    </div>
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
    margin: 0 0 0.3rem;
  }
  .lead {
    color: #6b7280;
    margin: 0 0 1.8rem;
    font-size: 0.95rem;
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
</style>
