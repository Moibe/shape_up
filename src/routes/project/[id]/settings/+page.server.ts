import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, pitches } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Project settings: rename + delete. Internal work (no project id) has no settings.
export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(404, 'Proyecto no encontrado');

	const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
	if (!project) throw error(404, 'Proyecto no encontrado');

	const pitchRows = await db.query.pitches.findMany({
		where: eq(pitches.projectId, id),
		columns: { id: true }
	});

	return { project, pitchCount: pitchRows.length };
};

export const actions: Actions = {
	rename: async ({ request, params }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) throw error(404, 'Proyecto no encontrado');

		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		const notes = String(fd.get('notes') ?? '').trim();
		if (!name) return fail(400, { nameError: 'El nombre es obligatorio.' });

		await db.update(projects).set({ name, notes: notes || null }).where(eq(projects.id, id));
		throw redirect(303, `/project/${id}`);
	},

	// Archive: soft-delete (hide, reversible). Always available.
	archive: async ({ params }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) throw error(404, 'Proyecto no encontrado');
		await db.update(projects).set({ archived: true }).where(eq(projects.id, id));
		throw redirect(303, '/');
	},

	// Delete: permanent, and ONLY for an empty project. If it still has pitches,
	// refuse and tell the user to remove them first (or archive instead).
	delete: async ({ params }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) throw error(404, 'Proyecto no encontrado');

		const hasPitches = await db.query.pitches.findFirst({
			where: eq(pitches.projectId, id),
			columns: { id: true }
		});
		if (hasPitches) {
			return fail(409, {
				deleteError:
					'No se puede borrar mientras tenga pitches. Borra sus pitches primero, o usa Archivar.'
			});
		}

		try {
			await db.delete(projects).where(eq(projects.id, id));
		} catch {
			return fail(409, {
				deleteError: 'No se pudo borrar: el proyecto tiene contenido asociado. Archívalo mejor.'
			});
		}
		throw redirect(303, '/');
	}
};
