import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { projects, pitches, type Appetite } from '$lib/server/db/schema';
import { readPitchForm, validatePitchForm } from '$lib/server/pitch-form';
import { requireAdmin } from '$lib/server/access';

// A pitch is always created inside a project (arrives via ?project=<id>). Without
// a valid project there's nothing to attach it to → back to the home overview.
// Creating pitches is admin-only.
export const load: PageServerLoad = async ({ url, locals }) => {
	requireAdmin(locals.user);
	const raw = url.searchParams.get('project') ?? '';
	const projectId = Number(raw);
	if (!raw || !Number.isInteger(projectId) || projectId <= 0) throw redirect(303, '/');

	const project = await db.query.projects.findFirst({
		where: eq(projects.id, projectId),
		columns: { id: true, name: true }
	});
	if (!project) throw redirect(303, '/');

	return { project };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		requireAdmin(locals.user);
		const fd = await request.formData();
		const v = readPitchForm(fd);
		const errors = validatePitchForm(v);
		if (Object.keys(errors).length) return fail(400, { errors, values: v });

		// The project comes from a hidden field set to the context project.
		const projectId = Number(fd.get('projectId'));
		if (!Number.isInteger(projectId) || projectId <= 0) throw error(400, 'Proyecto inválido');
		const project = await db.query.projects.findFirst({
			where: eq(projects.id, projectId),
			columns: { id: true }
		});
		if (!project) throw error(400, 'Proyecto inválido');

		// El diagrama solo se guarda si es JSON válido (el editor siempre emite JSON
		// válido o ''); ante basura manipulada, se guarda null. Mismo criterio que
		// updateField en el detalle, sin romper el alta.
		let diagram: string | null = null;
		if (v.dataModelDiagram) {
			try {
				JSON.parse(v.dataModelDiagram);
				diagram = v.dataModelDiagram;
			} catch {
				diagram = null;
			}
		}

		const [p] = await db
			.insert(pitches)
			.values({
				title: v.title,
				problem: v.problem,
				appetite: v.appetite as Appetite,
				solutionSketch: v.solutionSketch || null,
				dataModelDiagram: diagram,
				projectId,
				status: 'draft'
			})
			.returning({ id: pitches.id });

		throw redirect(303, `/pitch/${p.id}`);
	}
};
