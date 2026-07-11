<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
  // Evita crear proyectos duplicados por doble-click.
  let submitting = $state(false);
</script>

<div class="wrap">
  <a class="back" href="/">← Volver</a>
  <h1>Nuevo proyecto</h1>
  <p class="lead">Cada proyecto es su propio mundo, con sus propios pitches y relojes.</p>

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
    <div class="field">
      <label for="name">Nombre</label>
      <input id="name" name="name" type="text" value={form?.values?.name ?? ''} placeholder="Nombre del proyecto" />
      {#if form?.error}<span class="err" role="alert">{form.error}</span>{/if}
    </div>
    <div class="field">
      <label for="notes">Notas <span class="hint">(opcional)</span></label>
      <textarea id="notes" name="notes" rows="3" placeholder="Contexto, contactos, lo que sea">{form?.values?.notes ?? ''}</textarea>
    </div>
    <div class="actions">
      <a class="btn ghost" href="/">Cancelar</a>
      <button class="btn primary" type="submit" disabled={submitting}>Crear proyecto</button>
    </div>
  </form>
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
    margin: 0 0 0.3rem;
  }
  .lead {
    color: #6b7280;
    margin: 0 0 1.8rem;
    font-size: 0.95rem;
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
  .err {
    font-size: 0.78rem;
    color: #dc2626;
  }
</style>
