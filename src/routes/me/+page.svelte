<script lang="ts">
  import { enhance } from '$app/forms';
  import Avatar from '$lib/Avatar.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Abrir automáticamente si hay feedback de la acción (error o éxito).
  let pwOpen = $state(false);
  $effect(() => {
    if (form?.pwError || form?.pwChanged) pwOpen = true;
  });

  // Ojito independiente por campo.
  let showCurrent = $state(false);
  let showNext = $state(false);
  let showConfirm = $state(false);

  function fmt(iso: string | null) {
    if (!iso) return '—';
    return new Date(`${iso.replace(' ', 'T')}Z`).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
</script>

<section class="wrap">
  <a class="back" href="/">← Volver</a>
  <h1>Mi usuario</h1>

  <div class="profile">
    <Avatar username={data.username} size={64} />
    <div class="ident">
      <span class="uname">{data.username}</span>
      <span class="role {data.isAdmin ? 'admin' : 'member'}">{data.isAdmin ? 'Administrador' : 'Usuario'}</span>
      <span class="since">Desde {fmt(data.createdAt)}</span>
    </div>
  </div>

  <div class="scope">
    <h2>Proyectos</h2>
    {#if data.projectNames.length === 0}
      <p class="muted">
        {data.isAdmin
          ? 'Todavía no hay proyectos.'
          : 'Todavía no eres miembro de ningún proyecto. Pide a un administrador que te agregue.'}
      </p>
    {:else}
      <p>
        {data.isAdmin
          ? 'Como administrador, estás en todos los proyectos:'
          : 'Eres miembro de:'}
      </p>
      <ul class="proj-list">
        {#each data.projectNames as name}<li>{name}</li>{/each}
      </ul>
    {/if}
  </div>

  <div class="pw">
    <button type="button" class="pw-toggle" aria-expanded={pwOpen} onclick={() => (pwOpen = !pwOpen)}>
      Cambiar contraseña
      <span class="chevron" class:open={pwOpen}>▾</span>
    </button>
    {#if pwOpen}
    <form method="POST" action="?/changePassword" use:enhance>
      <div class="field">
        <label for="current">Contraseña actual</label>
        <div class="pw-wrap">
          <input id="current" name="current" type={showCurrent ? 'text' : 'password'} autocomplete="current-password" />
          <button type="button" class="eye" onclick={() => (showCurrent = !showCurrent)} aria-label={showCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showCurrent}>
            {@render eyeIcon(showCurrent)}
          </button>
        </div>
      </div>
      <div class="field">
        <label for="next">Nueva contraseña</label>
        <div class="pw-wrap">
          <input id="next" name="next" type={showNext ? 'text' : 'password'} autocomplete="new-password" />
          <button type="button" class="eye" onclick={() => (showNext = !showNext)} aria-label={showNext ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showNext}>
            {@render eyeIcon(showNext)}
          </button>
        </div>
      </div>
      <div class="field">
        <label for="confirm">Confirmar nueva</label>
        <div class="pw-wrap">
          <input id="confirm" name="confirm" type={showConfirm ? 'text' : 'password'} autocomplete="new-password" />
          <button type="button" class="eye" onclick={() => (showConfirm = !showConfirm)} aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showConfirm}>
            {@render eyeIcon(showConfirm)}
          </button>
        </div>
      </div>
      {#if form?.pwError}<span class="err" role="alert">{form.pwError}</span>{/if}
      {#if form?.pwChanged}<span class="ok" role="status">Contraseña actualizada.</span>{/if}
      <button class="btn primary" type="submit">Actualizar contraseña</button>
    </form>
    {/if}
  </div>
</section>

{#snippet eyeIcon(open: boolean)}
  {#if open}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  {:else}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  {/if}
{/snippet}

<style>
  .wrap {
    max-width: 520px;
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
    margin: 0 0 1.5rem;
  }
  .profile {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #f1f5f9;
  }
  .ident {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .uname {
    font-size: 1.3rem;
    font-weight: 700;
    color: #111111;
  }
  .role {
    align-self: flex-start;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
  }
  .role.admin {
    color: #15803d;
    background: rgba(22, 163, 74, 0.1);
    border: 1px solid rgba(22, 163, 74, 0.3);
  }
  .role.member {
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.1);
    border: 1px solid rgba(37, 99, 235, 0.3);
  }
  .since {
    font-size: 0.8rem;
    color: #6b7280;
  }
  h2 {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #16a34a;
    margin: 1.8rem 0 0.7rem;
  }
  .pw-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: none;
    border: none;
    padding: 0;
    margin: 1.8rem 0 0;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #16a34a;
    cursor: pointer;
  }
  .pw-toggle:hover {
    text-decoration: underline;
  }
  .chevron {
    font-size: 0.7rem;
    transition: transform 0.15s ease;
  }
  .chevron.open {
    transform: rotate(180deg);
  }
  .pw form {
    margin-top: 0.9rem;
  }
  .scope p {
    margin: 0;
    color: #1f2937;
  }
  .muted {
    color: #6b7280;
  }
  .proj-list {
    margin: 0.5rem 0 0;
    padding-left: 1.1rem;
    color: #1f2937;
    line-height: 1.7;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.55rem;
  }
  label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #111111;
    width: 130px;
    flex-shrink: 0;
  }
  input {
    font: inherit;
    color: #111111;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.45rem 0.65rem;
    box-sizing: border-box;
    width: 220px;
    max-width: 100%;
  }
  input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
  .pw-wrap {
    position: relative;
    display: flex;
    align-items: center;
    width: 220px;
    max-width: 100%;
  }
  .pw-wrap input {
    width: 100%;
    padding-right: 2.6rem;
  }
  .eye {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: none;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    border-radius: 6px;
  }
  .eye:hover {
    color: #2563eb;
  }
  .eye svg {
    width: 18px;
    height: 18px;
  }
  .err {
    display: block;
    margin-bottom: 0.8rem;
    font-size: 0.82rem;
    color: #dc2626;
  }
  .ok {
    display: block;
    margin-bottom: 0.8rem;
    font-size: 0.82rem;
    color: #15803d;
  }
  .btn {
    font: inherit;
    font-weight: 600;
    padding: 0.55rem 1.1rem;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    margin-top: 0.5rem;
  }
  .btn.primary {
    background: #2563eb;
    color: #ffffff;
  }
  .btn.primary:hover {
    background: #1d4ed8;
  }
</style>
