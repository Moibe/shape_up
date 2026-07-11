import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, pitches, type Appetite, type PitchStatus } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { readPitchForm, validatePitchForm } from '$lib/server/pitch-form';

// Statuses editable from the pitch form. 'building' and 'done' are excluded:
// those are driven by actions (Arrancar in the betting table, Marcar terminado
// on the pitch), not by the form.
const EDITABLE_STATUSES = ['draft', 'shaped', 'rejected'] as const;
type EditableStatus = (typeof EDITABLE_STATUSES)[number];

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(404, 'Pitch no encontrado');

	const pitch = await db.query.pitches.findFirst({ where: eq(pitches.id, id) });
	if (!pitch) throw error(404, 'Pitch no encontrado');

	const projectList = await db.query.projects.findMany({
		orderBy: (c, { asc }) => [asc(c.name)]
	});

	const values = {
		title: pitch.title,
		problem: pitch.problem,
		appetite: pitch.appetite,
		solutionSketch: pitch.solutionSketch ?? '',
		dataModel: pitch.dataModel ?? '',
		projectId: pitch.projectId != null ? String(pitch.projectId) : ''
	};

	return { pitch, values, projects: projectList, editableStatuses: EDITABLE_STATUSES };
};

export const actions: Actions = {
	// Named (not default): this route also has a `delete` action, and SvelteKit
	// forbids mixing a default action with named ones in the same file.
	update: async ({ request, params }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) throw error(404, 'Pitch no encontrado');

		const current = await db.query.pitches.findFirst({ where: eq(pitches.id, id) });
		if (!current) throw error(404, 'Pitch no encontrado');

		const fd = await request.formData();
		const v = readPitchForm(fd);
		const errors = validatePitchForm(v);
		if (Object.keys(errors).length) return fail(400, { errors, values: v });

		// A building/done pitch keeps its status (managed by actions). Otherwise
		// accept only the editable statuses; ignore anything else.
		let status: PitchStatus = current.status;
		if (current.status !== 'building' && current.status !== 'done') {
			const submitted = String(fd.get('status') ?? '');
			if ((EDITABLE_STATUSES as readonly string[]).includes(submitted)) {
				status = submitted as EditableStatus;
			}
		}

		// Resolve project (create if new).
		let projectId: number | null = null;
		if (v.projectId === '__new__') {
			const [c] = await db
				.insert(projects)
				.values({ name: v.newProjectName })
				.returning({ id: projects.id });
			projectId = c.id;
		} else if (v.projectId) {
			projectId = Number(v.projectId);
		}

		await db
			.update(pitches)
			.set({
				title: v.title,
				problem: v.problem,
				appetite: v.appetite as Appetite,
				solutionSketch: v.solutionSketch || null,
				dataModel: v.dataModel || null,
				projectId,
				status
			})
			.where(eq(pitches.id, id));

		throw redirect(303, `/pitch/${id}`);
	},

	delete: async ({ params }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) throw error(404, 'Pitch no encontrado');
		// FK cascade removes its nogos, scopes and tasks (foreign_keys = ON).
		await db.delete(pitches).where(eq(pitches.id, id));
		throw redirect(303, '/');
	}
};
