import type { PageServerLoad } from './$types';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { memberProjectIds } from '$lib/server/access';

// Archived projects visible to the user (admins: all; regular users: their own).
export const load: PageServerLoad = async ({ locals }) => {
	let ids: number[] | null = null;
	if (!locals.user!.isAdmin) {
		ids = await memberProjectIds(locals.user!.id);
		if (ids.length === 0) return { archived: [] };
	}
	const scope = ids ? inArray(projects.id, ids) : undefined;

	const rows = await db.query.projects.findMany({
		where: scope ? and(eq(projects.archived, true), scope) : eq(projects.archived, true),
		with: { pitches: { columns: { id: true } } },
		orderBy: (p, { asc }) => [asc(p.name)]
	});
	return {
		archived: rows.map((p) => ({ id: p.id, name: p.name, pitchCount: p.pitches.length }))
	};
};
