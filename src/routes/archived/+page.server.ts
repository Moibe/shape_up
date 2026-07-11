import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { projects } from '$lib/server/db/schema';

// Archived projects: soft-deleted (had pitches). Reachable to review or restore.
export const load: PageServerLoad = async () => {
	const rows = await db.query.projects.findMany({
		where: eq(projects.archived, true),
		with: { pitches: { columns: { id: true } } },
		orderBy: (p, { asc }) => [asc(p.name)]
	});
	return {
		archived: rows.map((p) => ({ id: p.id, name: p.name, pitchCount: p.pitches.length }))
	};
};
