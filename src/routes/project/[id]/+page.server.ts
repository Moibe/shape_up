import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { and, eq, isNull } from 'drizzle-orm';
import { pitches, projects } from '$lib/server/db/schema';
import { resolveProject } from '$lib/server/project-context';
import { requireAdmin } from '$lib/server/access';
import { pitchClock, todayIso } from '$lib/server/pitch-dates';

// Project dashboard: this project's in-flight work (building pitches, each with its
// OWN clock). No shared cycle — the clock lives on the pitch. The project header
// (name, counts) and rename/settings live in the project layout, not here; the
// `rename` action below stays as the endpoint that header's form posts to.
export const load: PageServerLoad = async ({ params, locals }) => {
	const world = await resolveProject(params.id, locals.user);
	const projectMatch =
		world.projectId === null ? isNull(pitches.projectId) : eq(pitches.projectId, world.projectId);

	const buildingRows = await db.query.pitches.findMany({
		where: and(eq(pitches.status, 'building'), projectMatch),
		with: { scopes: true },
		orderBy: (p, { asc }) => [asc(p.buildEndDate)]
	});
	const today = todayIso();
	const building = buildingRows.map((p) => ({ ...p, clock: pitchClock(p, today) }));

	return { world, building };
};

export const actions: Actions = {
	// Inline rename, posted from the project layout header. Internal work has no editable name.
	rename: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const world = await resolveProject(params.id, locals.user);
		if (world.projectId === null) {
			return fail(400, { renameError: 'El trabajo interno no se puede renombrar.' });
		}
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name) return fail(400, { renameError: 'El nombre no puede estar vacío.' });

		await db.update(projects).set({ name }).where(eq(projects.id, world.projectId));
		return { renamed: true };
	},

	// Restore an archived project back to the active list.
	unarchive: async ({ params, locals }) => {
		requireAdmin(locals.user);
		const world = await resolveProject(params.id, locals.user);
		if (world.projectId === null) return fail(400, { renameError: 'No aplica.' });
		await db.update(projects).set({ archived: false }).where(eq(projects.id, world.projectId));
		throw redirect(303, `/project/${world.projectId}`);
	}
};
