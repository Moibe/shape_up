<script lang="ts">
  // Campos compartidos por los formularios de crear y editar pitch. Los `name`
  // coinciden con readPitchForm() en el server. No incluye <form> ni submit: cada
  // página lo envuelve y agrega lo suyo (status, proyecto oculto, borrar, etc.).
  // El proyecto NO se elige aquí: se hereda del contexto (se crea el pitch dentro
  // de un proyecto), y la página lo manda por un input hidden.
  import DataModelDiagram from '$lib/DataModelDiagram.svelte';

  type Values = {
    title?: string;
    problem?: string;
    appetite?: string;
    solutionSketch?: string;
    dataModelDiagram?: string;
  };
  type Errors = Partial<Record<'title' | 'problem' | 'appetite', string>>;

  let { values = {}, errors = {} }: { values?: Values; errors?: Errors } = $props();
</script>

<div class="field">
  <label for="title">Título</label>
  <input id="title" name="title" type="text" value={values.title ?? ''} placeholder="Nombre corto del pitch" />
  {#if errors.title}<span class="err">{errors.title}</span>{/if}
</div>

<div class="field">
  <label for="problem">Problema</label>
  <textarea id="problem" name="problem" rows="3" placeholder="El problema, no la solución">{values.problem ?? ''}</textarea>
  {#if errors.problem}<span class="err">{errors.problem}</span>{/if}
</div>

<div class="field">
  <span class="label">Tamaño</span>
  <div class="appetite-opts">
    <label class="radio">
      <input type="radio" name="appetite" value="small" checked={values.appetite === 'small'} />
      <span><strong>chico</strong> · 2 semanas</span>
    </label>
    <label class="radio">
      <input type="radio" name="appetite" value="big" checked={values.appetite === 'big'} />
      <span><strong>grande</strong> · 6 semanas</span>
    </label>
  </div>
  {#if errors.appetite}<span class="err">{errors.appetite}</span>{/if}
</div>

<div class="field">
  <label for="solutionSketch">Solution sketch <span class="hint">(opcional, deliberadamente abstracto)</span></label>
  <textarea id="solutionSketch" name="solutionSketch" rows="2" placeholder="Fat-marker sketch">{values.solutionSketch ?? ''}</textarea>
</div>

<!-- Modelo de datos: editor gráfico, replegado por defecto (herramienta opcional).
     Se abre solo si lo decides — o si ya venía con contenido (reintento tras error). -->
<details class="disclosure" open={!!values.dataModelDiagram}>
  <summary>Modelo de datos <span class="hint">(opcional)</span></summary>
  <DataModelDiagram name="dataModelDiagram" value={values.dataModelDiagram ?? ''} />
</details>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1.1rem;
  }
  label,
  .label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #111111;
  }
  .hint {
    font-weight: 400;
    color: #6b7280;
  }
  input[type='text'],
  textarea {
    font: inherit;
    color: #111111;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.55rem 0.7rem;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  input[type='text']:focus,
  textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
  textarea {
    resize: vertical;
  }
  .appetite-opts {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .radio {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.8rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 400;
    flex: 1;
    min-width: 140px;
  }
  .radio:has(input:checked) {
    border-color: #2563eb;
    background: rgba(37, 99, 235, 0.06);
  }
  .radio input {
    accent-color: #2563eb;
  }
  .err {
    font-size: 0.78rem;
    color: #dc2626;
  }

  /* Disclosure replegable (modelo de datos): cerrado por defecto. */
  .disclosure {
    margin-bottom: 1.1rem;
  }
  .disclosure > summary {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    width: fit-content;
    font-size: 0.82rem;
    font-weight: 600;
    color: #2563eb;
    list-style: none;
    user-select: none;
  }
  .disclosure > summary::-webkit-details-marker {
    display: none;
  }
  .disclosure > summary::before {
    content: '＋';
    font-weight: 700;
    line-height: 1;
  }
  .disclosure[open] > summary {
    color: #111111;
    margin-bottom: 0.5rem;
  }
  .disclosure[open] > summary::before {
    content: '–';
  }
</style>
