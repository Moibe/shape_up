import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { and, eq, isNull } from 'drizzle-orm';
import { pitches } from '$lib/server/db/schema';
import { resolveProject } from '$lib/server/project-context';

// Finished pitches for a project (status = 'done'). Most-recently-finished first.
export const load: PageServerLoad = async ({ params, locals }) => {
	const world = await resolveProject(params.id, locals.user);
	const projectMatch =
		world.projectId === null ? isNull(pitches.projectId) : eq(pitches.projectId, world.projectId);

	const done = await db.query.pitches.findMany({
		where: and(eq(pitches.status, 'done'), projectMatch),
		with: { scopes: true },
		orderBy: (p, { desc }) => [desc(p.buildEndDate)]
	});

	return { world, done };
};
