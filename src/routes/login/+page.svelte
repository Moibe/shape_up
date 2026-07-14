<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  let { form }: { form: ActionData } = $props();
  let showPw = $state(false);
</script>

<div class="login-wrap">
  <div class="card">
    <div class="brand">
      <svg class="logo" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="login-mtn" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stop-color="#2563eb" />
            <stop offset="100%" stop-color="#16a34a" />
          </linearGradient>
        </defs>
        <path d="M2 20 L9 6 L12 12 L16 8 L22 20 Z" fill="url(#login-mtn)" />
      </svg>
      <span class="brand-title">Shape Up Buzzword</span>
    </div>

    <h1>Iniciar sesión</h1>

    <form method="POST" use:enhance>
      <div class="field">
        <label for="username">Usuario</label>
        <input id="username" name="username" type="text" autocomplete="username" value={form?.username ?? ''} />
      </div>
      <div class="field">
        <label for="password">Contraseña</label>
        <div class="pw-wrap">
          <input
            id="password"
            name="password"
            type={showPw ? 'text' : 'password'}
            autocomplete="current-password"
          />
          <button
            type="button"
            class="eye"
            onclick={() => (showPw = !showPw)}
            aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPw}
          >
            {#if showPw}
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
          </button>
        </div>
      </div>
      {#if form?.error}<span class="err" role="alert">{form.error}</span>{/if}
      <button class="btn primary" type="submit">Entrar</button>
    </form>
  </div>
</div>

<style>
  .login-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background: #ffffff;
  }
  .card {
    width: 100%;
    max-width: 380px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.1);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1.5rem;
  }
  .logo {
    width: 26px;
    height: 26px;
  }
  .brand-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #111111;
  }
  h1 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #111111;
    margin: 0 0 1.3rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1rem;
  }
  label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #111111;
  }
  input {
    font: inherit;
    color: #111111;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.6rem 0.7rem;
    box-sizing: border-box;
    width: 100%;
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
  }
  .pw-wrap input {
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
    margin: 0 0 1rem;
    font-size: 0.82rem;
    color: #dc2626;
  }
  .btn {
    width: 100%;
    font: inherit;
    font-weight: 600;
    padding: 0.65rem 1rem;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
  }
  .btn.primary {
    background: #2563eb;
    color: #ffffff;
  }
  .btn.primary:hover {
    background: #1d4ed8;
  }
</style>
