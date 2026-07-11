<script lang="ts">
  // Tailwind v4 + tokens de shadcn (base zinc, primary azul, charts verde, Roboto).
  // El fondo es BLANCO sólido; los :global de abajo van sin @layer para ganarle al
  // @layer base de Tailwind cuando hace falta.
  import '../app.css';
  import type { Snippet } from 'svelte';
  import favicon from '$lib/assets/favicon.svg';
  import TopNav from '$lib/TopNav.svelte';
  import Sidebar from '$lib/Sidebar.svelte';
  import ConfirmModal from '$lib/ConfirmModal.svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
  let collapsed = $state(false);

  // View Transitions cuando el browser las soporta para animar el repliegue.
  function withTransition(fn: () => void) {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(fn);
    } else {
      fn();
    }
  }
  function toggleCollapsed() {
    withTransition(() => {
      collapsed = !collapsed;
    });
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<TopNav />
<Sidebar {collapsed} {toggleCollapsed} projects={data.projects} archivedCount={data.archivedCount} />
<main class={collapsed ? 'collapsed' : ''}>
  <div class="work-scroll">
    {@render children()}
  </div>
</main>

<ConfirmModal />

<style>
  :global(:root) {
    --topnav-height: 64px;
  }

  :global(html, body) {
    margin: 0;
    padding: 0;
    height: 100%;
  }
  :global(body) {
    min-height: 100vh;
    /* Fondo BLANCO sólido; vivos azul/verde solo como acentos. */
    background: #ffffff;
    color: #111111;
    font-family: 'Roboto Variable', Roboto, system-ui, -apple-system, 'Segoe UI', sans-serif;
  }

  /* Scrollbars con tinte azul (vivo de marca). */
  :global(*) {
    scrollbar-width: auto;
    scrollbar-color: rgba(37, 99, 235, 0.55) rgba(37, 99, 235, 0.08);
  }
  :global(::-webkit-scrollbar) {
    width: 14px;
    height: 14px;
  }
  :global(::-webkit-scrollbar-track) {
    background: rgba(37, 99, 235, 0.06);
    border-radius: 999px;
  }
  :global(::-webkit-scrollbar-thumb) {
    background: rgba(37, 99, 235, 0.5);
    border-radius: 999px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  :global(::-webkit-scrollbar-thumb:hover) {
    background: rgba(37, 99, 235, 0.75);
    background-clip: padding-box;
  }

  main {
    position: fixed;
    top: calc(2rem + var(--topnav-height));
    right: 1rem;
    bottom: 1rem;
    box-sizing: border-box;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 6px 20px rgba(15, 23, 42, 0.06);
    overflow: hidden;
    transition: left 0.22s ease-out;
    left: calc(var(--sidebar-width, 240px) + 2rem);
  }
  main.collapsed {
    left: 2rem;
  }

  .work-scroll {
    position: absolute;
    top: 16px;
    bottom: 16px;
    left: 0;
    right: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 16px;
  }
</style>
