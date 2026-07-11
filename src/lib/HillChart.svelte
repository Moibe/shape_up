<script lang="ts">
  // Hill chart: cada scope es un punto sobre una loma. Izquierda (0–50) = subiendo
  // (descubriendo / incertidumbre); derecha (50–100) = bajando (ejecución). Los dots
  // se arrastran (o se mueven con flechas); al soltar se persiste la posición. Para
  // que los nombres nunca se encimen, los dots van NUMERADOS y los nombres viven en
  // una leyenda debajo (patrón del hill chart de Basecamp). Color por is_core.
  type Scope = {
    id: number;
    name: string;
    hillPosition: number;
    isCore: boolean;
    status: string;
  };
  let { scopes, onmove }: { scopes: Scope[]; onmove: (id: number, pos: number) => void } = $props();

  const indexed = $derived(scopes.map((s, i) => ({ ...s, n: i + 1 })));

  const VBW = 820;
  const VBH = 240;
  const MARGIN = 32;
  const innerW = VBW - MARGIN * 2;
  const baseline = VBH - 44;
  const amp = VBH - 92;

  const xOf = (p: number) => MARGIN + (p / 100) * innerW;
  const yOf = (p: number) => baseline - Math.sin((Math.PI * p) / 100) * amp;

  const curve = (() => {
    let d = '';
    for (let i = 0; i <= 100; i++) d += `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)} ${yOf(i).toFixed(1)}`;
    return d;
  })();
  const fillPath = `${curve}L${xOf(100).toFixed(1)} ${baseline}L${xOf(0).toFixed(1)} ${baseline}Z`;

  // Posiciones locales para arrastre fluido; se sincronizan de las props salvo
  // durante un arrastre activo.
  let pos = $state<Record<number, number>>({});
  let dragging = $state<number | null>(null);
  let svgEl: SVGSVGElement;

  $effect(() => {
    if (dragging === null) {
      const m: Record<number, number> = {};
      for (const s of scopes) m[s.id] = s.hillPosition;
      pos = m;
    }
  });

  function clientToPos(clientX: number): number {
    const rect = svgEl.getBoundingClientRect();
    const localX = (clientX - rect.left) * (VBW / rect.width);
    const t = (localX - MARGIN) / innerW;
    return Math.max(0, Math.min(100, Math.round(t * 100)));
  }

  function down(e: PointerEvent, id: number) {
    e.preventDefault();
    dragging = id;
    svgEl.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (dragging === null) return;
    pos = { ...pos, [dragging]: clientToPos(e.clientX) };
  }
  function up(e: PointerEvent) {
    if (dragging === null) return;
    const id = dragging;
    const p = pos[id];
    dragging = null;
    if (svgEl.hasPointerCapture?.(e.pointerId)) svgEl.releasePointerCapture(e.pointerId);
    onmove(id, p);
  }

  function key(e: KeyboardEvent, id: number, current: number) {
    let next = current;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(100, current + 5);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(0, current - 5);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 100;
    else return;
    e.preventDefault();
    pos = { ...pos, [id]: next };
    onmove(id, next);
  }
</script>

<div class="hill-wrap">
  <svg
    bind:this={svgEl}
    viewBox="0 0 {VBW} {VBH}"
    role="group"
    aria-label="Hill chart de scopes"
    onpointermove={move}
    onpointerup={up}
  >
    <defs>
      <linearGradient id="hillfill" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(37,99,235,0.12)" />
        <stop offset="100%" stop-color="rgba(22,163,74,0.12)" />
      </linearGradient>
    </defs>

    <path d={fillPath} fill="url(#hillfill)" />
    <line x1={MARGIN} y1={baseline} x2={VBW - MARGIN} y2={baseline} class="axis" />
    <line x1={xOf(50)} y1={yOf(50)} x2={xOf(50)} y2={baseline} class="crest" />
    <path d={curve} class="hill" />

    <text x={xOf(25)} y={baseline + 26} class="zone">descubriendo / incertidumbre</text>
    <text x={xOf(75)} y={baseline + 26} class="zone">ejecución / lo sé hacer</text>

    {#each indexed as s (s.id)}
      {@const p = pos[s.id] ?? s.hillPosition}
      <g class="dot-g" class:active={dragging === s.id}>
        <circle
          cx={xOf(p)}
          cy={yOf(p)}
          r="12"
          class="dot"
          class:core={s.isCore}
          class:done={s.status === 'done'}
          role="slider"
          tabindex="0"
          aria-label="{s.name}: posición en la loma"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={p}
          onpointerdown={(e) => down(e, s.id)}
          onkeydown={(e) => key(e, s.id, p)}
        />
        <text x={xOf(p)} y={yOf(p)} class="dotnum">{s.n}</text>
      </g>
    {/each}
  </svg>

  <ul class="legend">
    {#each indexed as s (s.id)}
      <li>
        <span class="num" class:core={s.isCore}>{s.n}</span>
        <span class="lname" class:done={s.status === 'done'}>{s.name}</span>
        <span class="lpos">loma {pos[s.id] ?? s.hillPosition}</span>
      </li>
    {/each}
  </ul>
  <p class="tip">
    Azul = core · verde = nice-to-have. Arrastra los puntos (o usa las flechas) para reflejar el avance real.
  </p>
</div>

<style>
  .hill-wrap {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 0.6rem 0.8rem 0.6rem;
    margin-bottom: 1.2rem;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
    touch-action: none;
  }
  .hill {
    fill: none;
    stroke: #94a3b8;
    stroke-width: 2;
  }
  .axis {
    stroke: #e5e7eb;
    stroke-width: 1.5;
  }
  .crest {
    stroke: rgba(17, 17, 17, 0.15);
    stroke-width: 1;
    stroke-dasharray: 4 4;
  }
  .zone {
    fill: #9ca3af;
    font-size: 13px;
    text-anchor: middle;
  }
  .dot {
    fill: #16a34a;
    stroke: #ffffff;
    stroke-width: 2.5;
    cursor: grab;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  }
  .dot.core {
    fill: #2563eb;
  }
  .dot.done {
    stroke: #16a34a;
    stroke-width: 3.5;
  }
  .dot:focus {
    outline: none;
    stroke: #1d4ed8;
    stroke-width: 3.5;
  }
  .dot-g.active .dot {
    cursor: grabbing;
    stroke: #1d4ed8;
    stroke-width: 3.5;
  }
  .dotnum {
    fill: #ffffff;
    font-size: 12px;
    font-weight: 700;
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }

  .legend {
    list-style: none;
    margin: 0.6rem 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.35rem 1rem;
  }
  .legend li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }
  .num {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #16a34a;
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .num.core {
    background: #2563eb;
  }
  .lname {
    color: #111111;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lname.done {
    text-decoration: line-through;
    color: #6b7280;
  }
  .lpos {
    margin-left: auto;
    font-size: 0.75rem;
    color: #6b7280;
    font-variant-numeric: tabular-nums;
  }
  .tip {
    margin: 0.6rem 0 0.2rem;
    font-size: 0.78rem;
    color: #6b7280;
    font-style: italic;
  }
</style>
