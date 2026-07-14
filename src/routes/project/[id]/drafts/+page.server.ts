import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { and, eq, isNull } from 'drizzle-orm';
import { pitches } from '$lib/server/db/schema';
import { resolveProject } from '$lib/server/project-context';

// Drafts for a project: pitches still being shaped (status = 'draft'). Before they
// reach the betting table.
export const load: PageServerLoad = async ({ params, locals }) => {
	const world = await resolveProject(params.id, locals.user);
	const projectMatch =
		world.projectId === null ? isNull(pitches.projectId) : eq(pitches.projectId, world.projectId);

	const drafts = await db.query.pitches.findMany({
		where: and(eq(pitches.status, 'draft'), projectMatch),
		orderBy: (p, { desc }) => [desc(p.createdAt)]
	});

	return { world, drafts };
};
