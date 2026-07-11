import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { projects } from '$lib/server/db/schema';

// Active (non-archived) projects power the sidebar's "worlds" list on every page.
// Archived ones live behind the "Archivados" view.
export const load: LayoutServerLoad = async () => {
	const active = await db.query.projects.findMany({
		where: eq(projects.archived, false),
		orderBy: (c, { asc }) => [asc(c.name)]
	});
	const archived = await db.query.projects.findMany({
		where: eq(projects.archived, true),
		columns: { id: true }
	});
	return { projects: active, archivedCount: archived.length };
};
