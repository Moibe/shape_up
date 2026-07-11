<script lang="ts">
  // Campos compartidos por los formularios de crear y editar pitch. Los `name`
  // coinciden con readPitchForm() en el server. No incluye <form> ni submit: cada
  // página lo envuelve y agrega lo suyo (status, borrar, etc.).
  import { untrack } from 'svelte';
  type ProjectOpt = { id: number; name: string };
  type Values = {
    title?: string;
    problem?: string;
    appetite?: string;
    solutionSketch?: string;
    dataModel?: string;
    projectId?: string;
    newProjectName?: string;
  };
  type Errors = Partial<Record<'title' | 'problem' | 'appetite' | 'project', string>>;

  let {
    projects = [],
    values = {},
    errors = {}
  }: { projects?: ProjectOpt[]; values?: Values; errors?: Errors } = $props();

  // Valor inicial del select (luego lo controla el usuario) — untrack evita que se
  // reinterprete como dependencia reactiva del prop.
  let projectSel = $state(untrack(() => values.projectId ?? ''));
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
  <span class="label">Appetite</span>
  <div class="appetite-opts">
    <label class="radio">
      <input type="radio" name="appetite" value="small" checked={values.appetite === 'small'} />
      <span><strong>small</strong> · 2 semanas</span>
    </label>
    <label class="radio">
      <input type="radio" name="appetite" value="big" checked={values.appetite === 'big'} />
      <span><strong>big</strong> · 6 semanas</span>
    </label>
  </div>
  {#if errors.appetite}<span class="err">{errors.appetite}</span>{/if}
</div>

<div class="field">
  <label for="solutionSketch">Solution sketch <span class="hint">(opcional, deliberadamente abstracto)</span></label>
  <textarea id="solutionSketch" name="solutionSketch" rows="2" placeholder="Fat-marker sketch">{values.solutionSketch ?? ''}</textarea>
</div>

<div class="field">
  <label for="dataModel">Modelo de datos <span class="hint">(Markdown: ## títulos, - listas)</span></label>
  <textarea id="dataModel" name="dataModel" rows="4" class="mono" placeholder={'## Modelo de datos\n- **Entidad** 1:N **Otra**'}>{values.dataModel ?? ''}</textarea>
</div>

<div class="field">
  <label for="projectId">Proyecto <span class="hint">(opcional — vacío = trabajo interno)</span></label>
  <select id="projectId" name="projectId" bind:value={projectSel}>
    <option value="">— Sin proyecto —</option>
    {#each projects as c (c.id)}
      <option value={String(c.id)}>{c.name}</option>
    {/each}
    <option value="__new__">＋ Nuevo proyecto…</option>
  </select>
  {#if projectSel === '__new__'}
    <input
      class="new-project"
      name="newProjectName"
      type="text"
      value={values.newProjectName ?? ''}
      placeholder="Nombre del nuevo proyecto"
    />
  {/if}
  {#if errors.project}<span class="err">{errors.project}</span>{/if}
</div>

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
  textarea,
  select {
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
  textarea:focus,
  select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
  textarea {
    resize: vertical;
  }
  textarea.mono {
    font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
    font-size: 0.85rem;
  }
  .new-project {
    margin-top: 0.5rem;
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
</style>
