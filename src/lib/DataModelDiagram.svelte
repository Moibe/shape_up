<script lang="ts">
  // Mini editor de modelo de datos tipo ER: cuadritos (entidades) que se arrastran,
  // y relaciones entre dos cuadros con su cardinalidad (1:1 · 1:N · N:M). El estado
  // se serializa a JSON en un <input hidden> para que viaje con cualquier <form>.
  //   { entities: [{id,name,x,y}], rels: [{id,from,to,kind,label}] }
  type Entity = { id: string; name: string; x: number; y: number };
  type Rel = { id: string; from: string; to: string; kind: string; label: string };
  type Model = { entities: Entity[]; rels: Rel[] };

  import { untrack } from 'svelte';

  let {
    value = '',
    name = 'dataModelDiagram',
    readonly = false
  }: { value?: string; name?: string; readonly?: boolean } = $props();

  const VIEW_W = 640;
  const VIEW_H = 380;
  const BOX_W = 132;
  const BOX_H = 52;
  const KINDS = ['1:1', '1:N', 'N:M'];

  function parse(v: string): Model {
    if (!v) return { entities: [], rels: [] };
    try {
      const m = JSON.parse(v);
      return {
        entities: Array.isArray(m?.entities) ? m.entities : [],
        rels: Array.isArray(m?.rels) ? m.rels : []
      };
    } catch {
      return { entities: [], rels: [] };
    }
  }

  // `value` solo siembra el estado inicial; a partir de ahí el componente es dueño
  // del modelo (se remonta con un value fresco cuando hace falta). untrack evita el
  // warning de "state referenced locally".
  let model = $state<Model>(untrack(() => parse(value)));
  let selectedId = $state<string | null>(null);
  let editingNameId = $state<string | null>(null);
  let relFrom = $state('');
  let relTo = $state('');
  let relKind = $state('1:N');

  // Enfoca (y selecciona) el input al montarse; el atributo autofocus no dispara en
  // elementos insertados dinámicamente (tras el doble-click), un action sí.
  function focusNode(node: HTMLInputElement) {
    node.focus();
    node.select();
  }

  const isEmpty = $derived(model.entities.length === 0 && model.rels.length === 0);
  // Vacío => cadena vacía (para que el campo se guarde como NULL en el server).
  const serialized = $derived(isEmpty ? '' : JSON.stringify(model));
  const selected = $derived(model.entities.find((e) => e.id === selectedId) ?? null);

  function uid(): string {
    const c = globalThis.crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID().slice(0, 8);
    return 'n' + Math.floor(performance.now()).toString(36) + model.entities.length;
  }

  const entity = (id: string) => model.entities.find((e) => e.id === id) ?? null;
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  const center = (e: Entity) => ({ x: e.x + BOX_W / 2, y: e.y + BOX_H / 2 });

  function addEntity() {
    const n = model.entities.length;
    const e: Entity = {
      id: uid(),
      name: 'Entidad',
      x: 30 + (n % 3) * 165,
      y: 30 + Math.floor(n / 3) * 95
    };
    model.entities.push(e);
    selectedId = e.id;
  }

  function delEntity(id: string) {
    model.entities = model.entities.filter((e) => e.id !== id);
    model.rels = model.rels.filter((r) => r.from !== id && r.to !== id);
    if (selectedId === id) selectedId = null;
    if (relFrom === id) relFrom = '';
    if (relTo === id) relTo = '';
  }

  function addRel() {
    if (!relFrom || !relTo || relFrom === relTo) return;
    model.rels.push({ id: uid(), from: relFrom, to: relTo, kind: relKind, label: '' });
    relFrom = '';
    relTo = '';
  }

  const delRel = (id: string) => (model.rels = model.rels.filter((r) => r.id !== id));

  // ── Arrastre de cuadros ────────────────────────────────────────────────────
  let svgEl: SVGSVGElement | null = $state(null);
  let dragId: string | null = null;
  let dragDx = 0;
  let dragDy = 0;

  function toSvg(ev: PointerEvent) {
    const rect = svgEl!.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((ev.clientY - rect.top) / rect.height) * VIEW_H
    };
  }

  function startDrag(ev: PointerEvent, e: Entity) {
    if (readonly) return;
    selectedId = e.id;
    const p = toSvg(ev);
    dragId = e.id;
    dragDx = p.x - e.x;
    dragDy = p.y - e.y;
    (ev.currentTarget as Element).setPointerCapture(ev.pointerId);
    ev.preventDefault();
  }
  function onMove(ev: PointerEvent) {
    if (!dragId) return;
    const e = entity(dragId);
    if (!e) return;
    const p = toSvg(ev);
    e.x = clamp(p.x - dragDx, 0, VIEW_W - BOX_W);
    e.y = clamp(p.y - dragDy, 0, VIEW_H - BOX_H);
  }
  const endDrag = () => (dragId = null);
</script>

<div class="dm-diagram" class:readonly>
  <input type="hidden" {name} value={serialized} />

  {#if !readonly}
    <div class="toolbar">
      <button type="button" class="tb-btn" onclick={addEntity}>＋ Entidad</button>
      {#if selected}
        <span class="sep"></span>
        <input
          class="name-input"
          aria-label="Nombre de la entidad"
          bind:value={selected.name}
          placeholder="Nombre"
        />
        <button type="button" class="tb-btn danger" onclick={() => delEntity(selected.id)}>Borrar cuadro</button>
      {/if}
    </div>
  {/if}

  {#if isEmpty && readonly}
    <p class="dm-empty">Sin modelo de datos.</p>
  {:else}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <svg
      bind:this={svgEl}
      class="canvas"
      viewBox="0 0 {VIEW_W} {VIEW_H}"
      role="img"
      aria-label="Diagrama de modelo de datos"
      onpointermove={onMove}
      onpointerup={endDrag}
      onpointerleave={endDrag}
    >
      <defs>
        <marker id="dm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#94a3b8" />
        </marker>
      </defs>

      <!-- Relaciones primero (van detrás de los cuadros) -->
      {#each model.rels as r (r.id)}
        {@const a = entity(r.from)}
        {@const b = entity(r.to)}
        {#if a && b}
          {@const ca = center(a)}
          {@const cb = center(b)}
          {@const mx = (ca.x + cb.x) / 2}
          {@const my = (ca.y + cb.y) / 2}
          <line x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y} class="rel-line" marker-end="url(#dm-arrow)" />
          <g class="rel-label">
            <rect x={mx - 18} y={my - 11} width="36" height="18" rx="4" />
            <text x={mx} y={my}>{r.kind}</text>
          </g>
        {/if}
      {/each}

      <!-- Entidades -->
      {#each model.entities as e (e.id)}
        <g
          class="ent"
          class:selected={selectedId === e.id}
          onpointerdown={(ev) => startDrag(ev, e)}
          ondblclick={() => {
            if (readonly) return;
            selectedId = e.id;
            editingNameId = e.id;
          }}
          role="button"
          tabindex={readonly ? -1 : 0}
        >
          <rect x={e.x} y={e.y} width={BOX_W} height={BOX_H} rx="9" />
          {#if editingNameId === e.id}
            <foreignObject x={e.x} y={e.y} width={BOX_W} height={BOX_H}>
              <input
                class="name-edit"
                bind:value={e.name}
                use:focusNode
                onpointerdown={(ev) => ev.stopPropagation()}
                onblur={() => (editingNameId = null)}
                onkeydown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === 'Escape') {
                    ev.preventDefault();
                    editingNameId = null;
                  }
                }}
              />
            </foreignObject>
          {:else}
            <text x={e.x + BOX_W / 2} y={e.y + BOX_H / 2}>{e.name}</text>
          {/if}
        </g>
      {/each}
    </svg>
  {/if}

  {#if !readonly}
    <div class="rel-maker">
      <select bind:value={relFrom} aria-label="Entidad origen">
        <option value="">— entidad —</option>
        {#each model.entities as e (e.id)}<option value={e.id}>{e.name}</option>{/each}
      </select>
      <select bind:value={relKind} aria-label="Cardinalidad" class="kind">
        {#each KINDS as k}<option value={k}>{k}</option>{/each}
      </select>
      <select bind:value={relTo} aria-label="Entidad destino">
        <option value="">— entidad —</option>
        {#each model.entities as e (e.id)}<option value={e.id}>{e.name}</option>{/each}
      </select>
      <button type="button" class="tb-btn" onclick={addRel} disabled={!relFrom || !relTo || relFrom === relTo}>
        ＋ Relación
      </button>
    </div>

    {#if model.rels.length > 0}
      <ul class="rel-list">
        {#each model.rels as r (r.id)}
          {@const a = entity(r.from)}
          {@const b = entity(r.to)}
          <li>
            <span>{a?.name ?? '?'} <strong>{r.kind}</strong> {b?.name ?? '?'}</span>
            <button type="button" class="x" aria-label="Quitar relación" onclick={() => delRel(r.id)}>✕</button>
          </li>
        {/each}
      </ul>
    {/if}

    {#if isEmpty}
      <p class="dm-hint">Agrega tu primer cuadro con <strong>＋ Entidad</strong>, luego otro, y únelos con una relación.</p>
    {:else}
      <p class="dm-hint">Arrastra los cuadros para acomodarlos · doble-click en uno para renombrarlo.</p>
    {/if}
  {/if}
</div>

<style>
  .dm-diagram {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .sep {
    width: 1px;
    align-self: stretch;
    background: #e5e7eb;
    margin: 0 0.1rem;
  }
  .tb-btn {
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.4rem 0.7rem;
    border-radius: 7px;
    border: 1px solid #d1d5db;
    background: #ffffff;
    color: #374151;
    cursor: pointer;
    white-space: nowrap;
  }
  .tb-btn:hover:not(:disabled) {
    border-color: #2563eb;
    color: #2563eb;
  }
  .tb-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .tb-btn.danger {
    border-color: rgba(220, 38, 38, 0.35);
    color: #dc2626;
  }
  .tb-btn.danger:hover {
    background: rgba(220, 38, 38, 0.06);
    border-color: #dc2626;
  }
  .name-input {
    font: inherit;
    font-size: 0.85rem;
    padding: 0.35rem 0.55rem;
    border: 1px solid #d1d5db;
    border-radius: 7px;
    min-width: 140px;
  }
  .name-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }

  .canvas {
    width: 100%;
    height: auto;
    background:
      linear-gradient(#f8fafc 0 0) padding-box,
      repeating-linear-gradient(0deg, transparent 0 23px, rgba(15, 23, 42, 0.035) 23px 24px),
      repeating-linear-gradient(90deg, transparent 0 23px, rgba(15, 23, 42, 0.035) 23px 24px);
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    touch-action: none;
  }
  .dm-diagram.readonly .canvas {
    background: #f8fafc;
  }

  .rel-line {
    stroke: #94a3b8;
    stroke-width: 1.6;
  }
  .rel-label rect {
    fill: #ffffff;
    stroke: #e2e8f0;
    stroke-width: 1;
  }
  .rel-label text {
    fill: #475569;
    font-size: 11px;
    font-weight: 700;
    text-anchor: middle;
    dominant-baseline: central;
  }

  .ent rect {
    fill: #ffffff;
    stroke: #2563eb;
    stroke-width: 1.5;
    filter: drop-shadow(0 2px 4px rgba(15, 23, 42, 0.08));
  }
  .ent text {
    fill: #111111;
    font-size: 13px;
    font-weight: 600;
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }
  /* Input in-place (doble-click en el cuadro). Llena la caja. */
  .name-edit {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: 2px solid #16a34a;
    border-radius: 9px;
    background: #ffffff;
    text-align: center;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #111111;
    padding: 0 0.4rem;
  }
  .name-edit:focus {
    outline: none;
  }
  .dm-diagram:not(.readonly) .ent {
    cursor: grab;
  }
  .dm-diagram:not(.readonly) .ent:active {
    cursor: grabbing;
  }
  .ent.selected rect {
    stroke: #16a34a;
    stroke-width: 2.5;
  }
  .ent:focus {
    outline: none;
  }
  .ent:focus-visible rect {
    stroke: #16a34a;
    stroke-width: 2.5;
  }

  .rel-maker {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .rel-maker select {
    font: inherit;
    font-size: 0.82rem;
    padding: 0.35rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 7px;
    background: #ffffff;
    color: #111111;
    max-width: 40%;
  }
  .rel-maker select.kind {
    max-width: 5rem;
    font-weight: 700;
  }

  .rel-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .rel-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    font-size: 0.85rem;
    color: #4b5563;
    padding: 0.3rem 0.55rem;
    background: #f9fafb;
    border: 1px solid #eef2f7;
    border-radius: 7px;
  }
  .rel-list .x {
    background: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0 0.2rem;
  }
  .rel-list .x:hover {
    color: #dc2626;
  }

  .dm-hint {
    margin: 0;
    font-size: 0.82rem;
    color: #6b7280;
  }
  .dm-empty {
    margin: 0;
    color: #6b7280;
  }
</style>
