import { APPETITES, type Appetite } from './db/schema';

// Shared parsing + validation for the pitch create/edit forms. Keeps the two
// actions in sync and the schema enums as the single source of truth.

export type PitchFormValues = {
	title: string;
	problem: string;
	appetite: string;
	solutionSketch: string;
	dataModelDiagram: string; // JSON del diagrama ER (o '' si vacío)
	projectId: string; // '', a project id, or the sentinel '__new__'
	newProjectName: string;
};

export type PitchFormErrors = Partial<
	Record<'title' | 'problem' | 'appetite' | 'project', string>
>;

export function readPitchForm(data: FormData): PitchFormValues {
	return {
		title: String(data.get('title') ?? '').trim(),
		problem: String(data.get('problem') ?? '').trim(),
		appetite: String(data.get('appetite') ?? ''),
		solutionSketch: String(data.get('solutionSketch') ?? '').trim(),
		dataModelDiagram: String(data.get('dataModelDiagram') ?? '').trim(),
		projectId: String(data.get('projectId') ?? ''),
		newProjectName: String(data.get('newProjectName') ?? '').trim()
	};
}

export function validatePitchForm(v: PitchFormValues): PitchFormErrors {
	const e: PitchFormErrors = {};
	if (!v.title) e.title = 'El título es obligatorio.';
	if (!v.problem) e.problem = 'Describe el problema (no la solución).';
	if (!APPETITES.includes(v.appetite as Appetite)) e.appetite = 'Elige un tamaño.';
	if (v.projectId === '__new__' && !v.newProjectName)
		e.project = 'Escribe el nombre del nuevo proyecto.';
	return e;
}
