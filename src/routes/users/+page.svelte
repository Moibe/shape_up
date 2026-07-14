<script lang="ts">
  import { enhance } from '$app/forms';
  import { confirmAndSubmit } from '$lib/confirm.svelte';
  import Avatar from '$lib/Avatar.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  // data.user viene del layout (usuario en sesión); data.users de esta página.
  const meId = $derived(data.user?.id ?? -1);

  function fmt(iso: string) {
    return new Date(`${iso.replace(' ', 'T')}Z`).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
</script>

<section class="wrap">
  <a class="back" href="/">← Volver</a>
  <h1>Usuarios</h1>
  <p class="lead">Quiénes pueden entrar al sistema. Da de alta desde aquí.</p>

  <div class="list">
    {#each data.users as u (u.id)}
      <div class="row">
        <div class="left">
          <Avatar username={u.username} size={38} />
          <div class="info">
            <span class="name">
              {u.username}
              {#if u.isAdmin}<span class="admin-badge">admin</span>{/if}
              {#if u.id === meId}<span class="you">tú</span>{/if}
            </span>
            <span class="meta">desde {fmt(u.createdAt)}</span>
          </div>
        </div>
        {#if u.id !== meId}
          <form method="POST" action="?/delete" use:enhance>
            <input type="hidden" name="userId" value={u.id} />
            <button
              class="btn danger sm"
              type="button"
              onclick={(e) =>
                confirmAndSubmit(e.currentTarget, {
                  title: 'Borrar usuario',
                  message: `¿Borrar al usuario "${u.username}"? Perderá el acceso.`,
                  confirmLabel: 'Borrar',
                  variant: 'danger'
                })}
            >
              Borrar
            </button>
          </form>
        {/if}
      </div>
    {/each}
  </div>
  {#if form?.deleteError}<span class="err" role="alert">{form.deleteError}</span>{/if}

  <div class="add">
    <h2>Agregar usuario</h2>
    <form method="POST" action="?/create" use:enhance>
      <div class="fields">
        <input name="username" type="text" placeholder="Usuario" value={form?.username ?? ''} autocomplete="off" />
        <input name="password" type="password" placeholder="Contraseña (mín. 4)" autocomplete="new-password" />
        <button class="btn primary" type="submit">Agregar</button>
      </div>
      <label class="chk"><input type="checkbox" name="isAdmin" /> Administrador (puede gestionar usuarios)</label>
      {#if form?.createError}<span class="err" role="alert">{form.createError}</span>{/if}
    </form>
  </div>
</section>

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
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
  }
  .left {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  .info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .name {
    font-weight: 600;
    color: #111111;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .you {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.1);
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
  }
  .admin-badge {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #15803d;
    background: rgba(22, 163, 74, 0.1);
    border: 1px solid rgba(22, 163, 74, 0.3);
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
  }
  .chk {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.7rem;
    font-size: 0.85rem;
    color: #374151;
  }
  .chk input {
    accent-color: #2563eb;
  }
  .meta {
    font-size: 0.78rem;
    color: #6b7280;
  }

  .add {
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #f1f5f9;
  }
  .add h2 {
    font-size: 1rem;
    font-weight: 700;
    color: #111111;
    margin: 0 0 0.8rem;
  }
  .fields {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  input {
    font: inherit;
    color: #111111;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.55rem 0.7rem;
    flex: 1;
    min-width: 140px;
    box-sizing: border-box;
  }
  input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
  .btn {
    font: inherit;
    font-weight: 600;
    padding: 0.55rem 1.1rem;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
  }
  .btn.sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.82rem;
  }
  .btn.primary {
    background: #2563eb;
    color: #ffffff;
  }
  .btn.primary:hover {
    background: #1d4ed8;
  }
  .btn.danger {
    background: transparent;
    border-color: rgba(220, 38, 38, 0.4);
    color: #dc2626;
  }
  .btn.danger:hover {
    background: rgba(220, 38, 38, 0.06);
  }
  .err {
    display: block;
    margin-top: 0.6rem;
    font-size: 0.8rem;
    color: #dc2626;
  }
</style>
