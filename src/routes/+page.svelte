<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<section class="home">
  <div class="page-top">
    <span class="app-eyebrow">ShapeUp Buzzword</span>
    <a class="btn primary" href="/project/new">＋ Proyecto</a>
  </div>

  {#if data.projects.length === 0}
    <div class="welcome">
      <span class="badge">Empieza aquí</span>
      <h1>Aún no tienes proyectos</h1>
      <p>Cada proyecto es su propio mundo, con sus propios pitches y relojes. Crea el primero.</p>
      <a class="btn primary" href="/project/new">＋ Nuevo proyecto</a>
    </div>
  {:else}
    <h1>Proyectos</h1>
    <p class="lead">Elige un proyecto para ver su tablero.</p>
    <div class="grid">
      {#each data.projects as p (p.id)}
        <a class="card" href="/project/{p.id}">
          <span class="dot" aria-hidden="true"></span>
          <h2>{p.name}</h2>
          <div class="stats">
            <span class="stat building">{p.building} en curso</span>
            <span class="stat shaped">{p.shaped} shaped</span>
            <span class="stat draft">{p.draft} borrador{p.draft === 1 ? '' : 'es'}</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  .home {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem 0.5rem 3rem;
  }
  .page-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .app-eyebrow {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #9ca3af;
  }
  .btn {
    font: inherit;
    font-weight: 600;
    font-size: 0.9rem;
    padding: 0.55rem 1.1rem;
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

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #111111;
    margin: 0 0 0.3rem;
  }
  .lead {
    color: #6b7280;
    margin: 0 0 1.5rem;
    font-size: 0.95rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }
  .card {
    display: block;
    text-decoration: none;
    color: inherit;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 1.2rem 1.3rem;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
    transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
  }
  .card:hover {
    border-color: rgba(37, 99, 235, 0.45);
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.09);
    transform: translateY(-2px);
  }
  .dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2563eb 0%, #16a34a 100%);
    margin-bottom: 0.6rem;
  }
  .card h2 {
    font-size: 1.15rem;
    font-weight: 700;
    color: #111111;
    margin: 0 0 0.7rem;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .stat {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    background: #f9fafb;
  }
  .stat.building {
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.1);
    border-color: rgba(37, 99, 235, 0.25);
  }
  .stat.shaped {
    color: #15803d;
    background: rgba(22, 163, 74, 0.1);
    border-color: rgba(22, 163, 74, 0.25);
  }

  .welcome {
    max-width: 520px;
    margin: 3rem auto 0;
    text-align: center;
    padding: 1.5rem 0.5rem;
  }
  .badge {
    display: inline-block;
    font-size: 0.78rem;
    font-weight: 600;
    color: #16a34a;
    background: rgba(22, 163, 74, 0.1);
    border: 1px solid rgba(22, 163, 74, 0.3);
    border-radius: 999px;
    padding: 0.3rem 0.8rem;
  }
  .welcome h1 {
    margin: 1rem 0 0.5rem;
  }
  .welcome p {
    color: #4b5563;
    line-height: 1.6;
    margin: 0 0 1.2rem;
  }
</style>
