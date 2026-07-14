<script lang="ts">
  // Barra lateral = lista de proyectos ("mundos"). Cada proyecto es independiente;
  // seleccionar uno scopea el Dashboard/Betting a ese proyecto. "Trabajo interno"
  // agrupa los pitches sin proyecto. Mantiene el tilt 3D y el handle de repliegue.
  import { page } from '$app/state';
  import { projectDotColor } from '$lib/project-colors';

  type ProjectOpt = { id: number; name: string };
  let {
    collapsed = false,
    toggleCollapsed,
    projects = [],
    archivedCount = 0,
    isAdmin = false
  }: {
    collapsed?: boolean;
    toggleCollapsed: () => void;
    projects?: ProjectOpt[];
    archivedCount?: number;
    isAdmin?: boolean;
  } = $props();

  let tiltX = $state(0);
  let tiltY = $state(0);
  let sidebarWidth = $state(240);

  $effect(() => {
    if (typeof document !== 'undefined' && !collapsed) {
      document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    }
  });

  // Segmento de proyecto actual en la URL (/project/<seg>[/...]) para resaltar.
  const currentSeg = $derived(page.url.pathname.match(/^\/project\/([^/]+)/)?.[1] ?? null);
  const isActive = (seg: string) => currentSeg === seg;


  function handleMove(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    const MAX = 1.2;
    tiltX = -ny * MAX;
    tiltY = nx * MAX;
  }
  function handleLeave() {
    tiltX = 0;
    tiltY = 0;
  }
  function handleCollapseClick(e: MouseEvent) {
    e.stopPropagation();
    tiltX = 0;
    tiltY = 0;
    toggleCollapsed();
  }
</script>

{#if !collapsed}
  <aside
    class="sidebar"
    style="transform: perspective(900px) rotateX({tiltX}deg) rotateY({tiltY}deg);"
    bind:clientWidth={sidebarWidth}
    onmousemove={handleMove}
    onmouseleave={handleLeave}
  >
    <span class="section">Proyectos</span>
    <nav>
      {#each projects as c, i (c.id)}
        <a
          href="/project/{c.id}"
          class="nav-item"
          aria-current={isActive(String(c.id)) ? 'page' : undefined}
        >
          <span class="dot" style="background: {projectDotColor(i)};" aria-hidden="true"></span>
          <span class="name">{c.name}</span>
        </a>
      {/each}
    </nav>

    {#if archivedCount > 0}
      <a
        href="/archived"
        class="archived-link"
        aria-current={page.url.pathname === '/archived' ? 'page' : undefined}
      >
        Archivados ({archivedCount})
      </a>
    {/if}

    {#if isAdmin}
      <a
        href="/users"
        class="admin-link"
        aria-current={page.url.pathname.startsWith('/users') ? 'page' : undefined}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        Usuarios
      </a>
    {/if}

    <div class="sidebar-footer">
      <button type="button" class="collapse-btn" onclick={handleCollapseClick} aria-label="Replegar barra">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
    </div>
  </aside>
{:else}
  <button type="button" class="reveal-handle" onclick={toggleCollapsed} aria-label="Mostrar barra">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
  </button>
{/if}

<style>
  .sidebar {
    position: fixed;
    top: calc(2rem + var(--topnav-height, 64px));
    left: 1rem;
    bottom: 1rem;
    box-sizing: border-box;
    width: max-content;
    min-width: 240px;
    max-width: 380px;
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(10px) saturate(120%);
    -webkit-backdrop-filter: blur(10px) saturate(120%);
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 6px 20px rgba(15, 23, 42, 0.08);
    transition: transform 0.18s ease-out;
    will-change: transform;
    user-select: none;
  }
  .section {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #9ca3af;
    padding: 0 0.5rem 0.6rem;
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  nav::-webkit-scrollbar {
    display: none;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.9rem;
    color: #374151;
    text-decoration: none;
    font-size: 0.92rem;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    background: #16a34a;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }
  .nav-item:hover {
    background: rgba(22, 163, 74, 0.08);
    border-color: rgba(22, 163, 74, 0.25);
    color: #111111;
  }
  .nav-item[aria-current='page'] {
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.1);
    border-color: rgba(37, 99, 235, 0.45);
    box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.12) inset;
  }
  .nav-item[aria-current='page'] .dot {
    background: #2563eb;
  }
  .archived-link {
    margin-top: 0.5rem;
    padding: 0.4rem 0.9rem;
    font-size: 0.82rem;
    color: #6b7280;
    text-decoration: none;
    border-radius: 8px;
  }
  .archived-link:hover {
    color: #111111;
    background: #f3f4f6;
  }
  .archived-link[aria-current='page'] {
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.08);
  }
  .admin-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding: 0.5rem 0.9rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #4b5563;
    text-decoration: none;
    border-radius: 8px;
  }
  .admin-link:hover {
    color: #111111;
    background: #f3f4f6;
  }
  .admin-link[aria-current='page'] {
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.08);
  }
  .sidebar-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  .collapse-btn,
  .reveal-handle {
    background: rgba(37, 99, 235, 0.06);
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.4rem 0.5rem;
    color: #2563eb;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font: inherit;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  }
  .collapse-btn:hover,
  .reveal-handle:hover {
    background: rgba(37, 99, 235, 0.12);
    border-color: rgba(37, 99, 235, 0.4);
    color: #1d4ed8;
  }
  .reveal-handle {
    position: fixed;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    padding: 0.55rem 0.45rem;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px) saturate(120%);
    -webkit-backdrop-filter: blur(10px) saturate(120%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 6px 20px rgba(15, 23, 42, 0.08);
    z-index: 10;
  }
</style>
