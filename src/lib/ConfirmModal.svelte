<script lang="ts">
  // Global confirm/alert modal — centered, styled to match the site. Driven by the
  // dialogState in confirm.svelte.ts. Mounted once in the root layout.
  import { dialogState, resolveDialog } from '$lib/confirm.svelte';

  const d = $derived(dialogState.current);

  function onKey(e: KeyboardEvent) {
    if (!d) return;
    if (e.key === 'Escape') resolveDialog(false);
  }
</script>

<svelte:window onkeydown={onKey} />

{#if d}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="overlay" onclick={() => resolveDialog(false)}>
    <div class="modal" role="dialog" aria-modal="true" aria-label={d.title} tabindex="-1" onclick={(e) => e.stopPropagation()}>
      <h2>{d.title}</h2>
      <p>{d.message}</p>
      <div class="actions">
        {#if d.cancelLabel}
          <button class="btn ghost" type="button" onclick={() => resolveDialog(false)}>{d.cancelLabel}</button>
        {/if}
        <!-- svelte-ignore a11y_autofocus -->
        <button class="btn {d.variant}" type="button" autofocus onclick={() => resolveDialog(true)}>{d.confirmLabel}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.35);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }
  .modal {
    width: 100%;
    max-width: 420px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 1.4rem 1.5rem 1.2rem;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
  }
  h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #111111;
    margin: 0 0 0.5rem;
  }
  p {
    margin: 0 0 1.3rem;
    color: #4b5563;
    font-size: 0.92rem;
    line-height: 1.5;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
  }
  .btn {
    font: inherit;
    font-weight: 600;
    font-size: 0.88rem;
    padding: 0.5rem 1.1rem;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
  }
  .btn.ghost {
    background: transparent;
    border-color: #d1d5db;
    color: #374151;
  }
  .btn.ghost:hover {
    border-color: #9ca3af;
  }
  .btn.primary {
    background: #2563eb;
    color: #ffffff;
  }
  .btn.primary:hover {
    background: #1d4ed8;
  }
  .btn.warn {
    background: #ea580c;
    color: #ffffff;
  }
  .btn.warn:hover {
    background: #c2410c;
  }
  .btn.danger {
    background: #dc2626;
    color: #ffffff;
  }
  .btn.danger:hover {
    background: #b91c1c;
  }
</style>
