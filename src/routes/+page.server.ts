import type { PageServerLoad } from './$types';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { memberProjectIds } from '$lib/server/access';

// Home: mosaic of the projects the current user can see (admins: all; regular
// users: only their member projects), with a quick summary of each.
export const load: PageServerLoad = async ({ locals }) => {
	let ids: number[] | null = null;
	if (!locals.user!.isAdmin) {
		ids = await memberProjectIds(locals.user!.id);
		if (ids.length === 0) return { projects: [] };
	}
	const scope = ids ? inArray(projects.id, ids) : undefined;

	const rows = await db.query.projects.findMany({
		where: scope ? and(eq(projects.archived, false), scope) : eq(projects.archived, false),
		with: { pitches: { columns: { status: true } } },
		orderBy: (p, { asc }) => [asc(p.name)]
	});

	const list = rows.map((p) => {
		let building = 0;
		let shaped = 0;
		let draft = 0;
		for (const pit of p.pitches) {
			if (pit.status === 'building') building++;
			else if (pit.status === 'shaped') shaped++;
			else if (pit.status === 'draft') draft++;
		}
		return { id: p.id, name: p.name, building, shaped, draft };
	});

	return { projects: list };
};
