import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { projects } from '$lib/server/db/schema';

// Home: a mosaic of all active projects with a quick summary of each. (No longer
// redirects to the first project — this is the overview / picker.)
export const load: PageServerLoad = async () => {
	const rows = await db.query.projects.findMany({
		where: eq(projects.archived, false),
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
