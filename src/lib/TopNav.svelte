<script lang="ts">
  // Barra superior clara con tilt 3D al pasar el mouse. Marca + área de usuario.
  import Avatar from '$lib/Avatar.svelte';
  let { user }: { user: { username: string } } = $props();

  let tiltX = $state(0);
  let tiltY = $state(0);

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
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<header
  class="topnav"
  style="transform: perspective(900px) rotateX({tiltX}deg) rotateY({tiltY}deg);"
  onmousemove={handleMove}
  onmouseleave={handleLeave}
>
  <a href="/" class="brand" aria-label="Inicio">
    <svg class="brand-ico" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="brand-mtn" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="#2563eb" />
          <stop offset="100%" stop-color="#16a34a" />
        </linearGradient>
      </defs>
      <path d="M2 20 L9 6 L12 12 L16 8 L22 20 Z" fill="url(#brand-mtn)" />
    </svg>
    <span class="brand-title">Shape Up Buzzword</span>
  </a>

  <div class="user-area">
    <a class="who" href="/me" title="Mi usuario">
      <Avatar username={user.username} size={28} />
      <span class="who-name">{user.username}</span>
    </a>
    <form method="POST" action="/logout">
      <button class="logout" type="submit">Salir</button>
    </form>
  </div>
</header>

<style>
  /* Vivos de la marca: azul (primario) + verde (secundario). */
  .topnav {
    position: fixed;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    height: var(--topnav-height, 64px);
    padding: 0 1.25rem;
    box-sizing: border-box;
    display: flex;
    align-items: center;
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
    z-index: 9;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: #111111;
    text-decoration: none;
    border-radius: 8px;
    padding: 0.25rem 0.4rem;
    transition: background 0.18s ease;
  }
  .brand:hover {
    background: rgba(37, 99, 235, 0.06);
  }
  .brand-ico {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: block;
  }
  .brand-title {
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.005em;
    color: #111111;
  }

  .user-area {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.9rem;
  }
  .who {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: #374151;
    text-decoration: none;
  }
  .who:hover .who-name {
    color: #2563eb;
  }
  .who-name {
    font-size: 0.85rem;
    font-weight: 600;
  }
  .logout {
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    color: #374151;
    background: transparent;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.35rem 0.8rem;
    cursor: pointer;
  }
  .logout:hover {
    border-color: #2563eb;
    color: #2563eb;
  }

  /* En pantallas chicas: oculta el título de la marca para que no se desborde. */
  @media (max-width: 680px) {
    .topnav {
      padding: 0 0.6rem;
    }
    .brand {
      gap: 0;
      padding: 0.25rem;
    }
    .brand-title {
      display: none;
    }
  }
</style>
