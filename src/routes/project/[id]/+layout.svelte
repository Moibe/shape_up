<script lang="ts">
  // Chrome a nivel de PROYECTO: envuelve todas sus vistas (dashboard, borradores,
  // betting, terminados, ajustes). El nombre del proyecto, sus contadores y Ajustes
  // no pertenecen a una vista sino al proyecto entero, por eso viven aquí — arriba,
  // por encima de las tabs.
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const world = $derived(data.world);
  const seg = $derived(world.projectId === null ? 'internal' : String(world.projectId));
  const isAdmin = $derived(data.user?.isAdmin ?? false);
  // El trabajo interno (projectId null) no es un proyecto renombrable/configurable.
  const isProject = $derived(world.projectId !== null);
  const canManage = $derived(isAdmin && isProject);
  const onSettings = $derived(page.url.pathname.endsWith('/settings'));

  let editingName = $state(false);
  let renameError = $state('');

  // El rename es un form action de página (los layouts no tienen actions), así que
  // posteamos al action del dashboard del proyecto. Con enhance manejamos el
  // resultado a mano: cerramos el editor y recargamos (invalidateAll) al tener éxito.
  function renameSubmit() {
    return async ({
      result
    }: {
      result: { type: string; data?: Record<string, unknown>; error?: { message?: string } };
    }) => {
      if (result.type === 'success') {
        renameError = '';
        editingName = false;
        await invalidateAll();
      } else if (result.type === 'failure') {
        renameError = String(result.data?.renameError ?? 'No se pudo renombrar.');
      } else {
        // 'error' (excepción en el server: 403/404/500) o 'redirect' inesperado:
        // no dejar el editor abierto en silencio, mostrar el fallo.
        renameError = result.error?.message ?? 'No se pudo renombrar. Intenta de nuevo.';
      }
    };
  }
</script>

<header class="project-head" class:narrow={onSettings}>
  <div class="head-main">
    <span class="eyebrow">Proyecto</span>
    {#if editingName && canManage}
      <form method="POST" action="/project/{seg}?/rename" class="rename-form" use:enhance={renameSubmit}>
        <!-- svelte-ignore a11y_autofocus -->
        <input name="name" value={world.label} aria-label="Nombre del proyecto" autofocus />
        <button class="btn primary sm" type="submit">Guardar</button>
        <button
          class="btn ghost sm"
          type="button"
          onclick={() => {
            editingName = false;
            renameError = '';
          }}>Cancelar</button
        >
      </form>
    {:else}
      <h1>
        {world.label}
        {#if canManage}
          <button class="edit-name" type="button" onclick={() => (editingName = true)} aria-label="Editar nombre">✎</button>
        {/if}
      </h1>
    {/if}
    {#if renameError}<span class="err" role="alert">{renameError}</span>{/if}
    <p class="sub">
      <a class="sub-link" href="/project/{seg}/drafts">{data.counts.draft} en borradores</a> ·
      <a class="sub-link" href="/project/{seg}/betting">{data.counts.shaped} en betting</a> ·
      <a class="sub-link" href="/project/{seg}">{data.counts.building} en curso</a> ·
      <a class="sub-link" href="/project/{seg}/done">
        {data.counts.done} {data.counts.done === 1 ? 'terminado' : 'terminados'}
      </a>
    </p>
  </div>

  {#if canManage}
    <a class="gear" href="/project/{seg}/settings" aria-current={onSettings ? 'page' : undefined}>
      <svg class="gico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      Ajustes
    </a>
  {/if}
</header>

{@render children()}

<style>
  .project-head {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem 0.5rem 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  /* Ajustes usa una columna más angosta (560px); el header la iguala ahí para no
     desalinear con el formulario. El resto de vistas son 960px. */
  .project-head.narrow {
    max-width: 560px;
  }
  .head-main {
    min-width: 0;
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
  .sub-link {
    color: #2563eb;
    text-decoration: none;
  }
  .sub-link:hover {
    text-decoration: underline;
  }

  .btn {
    font: inherit;
    font-weight: 600;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
  }
  .btn.sm {
    padding: 0.45rem 0.9rem;
    font-size: 0.85rem;
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

  .gear {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #4b5563;
    text-decoration: none;
    padding: 0.4rem 0.8rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #ffffff;
    transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
  }
  .gear:hover {
    border-color: #2563eb;
    color: #2563eb;
  }
  .gear[aria-current='page'] {
    color: #1d4ed8;
    border-color: rgba(37, 99, 235, 0.4);
    background: rgba(37, 99, 235, 0.06);
  }
  .gico {
    width: 15px;
    height: 15px;
  }
</style>
