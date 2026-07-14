import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { eq, isNull, sql } from 'drizzle-orm';
import { pitches } from '$lib/server/db/schema';
import { resolveProject } from '$lib/server/project-context';

// Project-wide chrome data: the project itself (its name) plus the counts shown in
// the header on every project view. Membership is enforced here too — resolveProject
// 404s for non-members, so the whole project subtree is guarded at the layout.
export const load: LayoutServerLoad = async ({ params, locals }) => {
	const world = await resolveProject(params.id, locals.user);
	const projectMatch =
		world.projectId === null ? isNull(pitches.projectId) : eq(pitches.projectId, world.projectId);

	// Counts por estatus (una sola query agrupada). Se muestran en el header en el
	// orden de las tabs: borradores · betting (shaped) · en curso (building) · terminados.
	const rows = await db
		.select({ status: pitches.status, n: sql<number>`count(*)` })
		.from(pitches)
		.where(projectMatch)
		.groupBy(pitches.status);

	const countOf = (s: string) => rows.find((r) => r.status === s)?.n ?? 0;
	const counts = {
		draft: countOf('draft'),
		shaped: countOf('shaped'),
		building: countOf('building'),
		done: countOf('done')
	};

	return { world, counts };
};
