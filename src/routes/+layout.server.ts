import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { memberProjectIds } from '$lib/server/access';

// Auth guard for the whole app: everything requires a logged-in user except the
// login page. Sidebar projects are scoped by visibility: admins see all, regular
// users only the projects they're a member of.
export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user && url.pathname !== '/login') {
		throw redirect(303, '/login');
	}
	if (!locals.user) {
		return { user: null, projects: [], archivedCount: 0 };
	}

	// Restrict to visible project ids (null = no restriction, for admins).
	let ids: number[] | null = null;
	if (!locals.user.isAdmin) {
		ids = await memberProjectIds(locals.user.id);
		if (ids.length === 0) {
			return { user: locals.user, projects: [], archivedCount: 0 };
		}
	}
	const scope = ids ? inArray(projects.id, ids) : undefined;

	const active = await db.query.projects.findMany({
		where: scope ? and(eq(projects.archived, false), scope) : eq(projects.archived, false),
		orderBy: (c, { asc }) => [asc(c.name)]
	});
	const archived = await db.query.projects.findMany({
		where: scope ? and(eq(projects.archived, true), scope) : eq(projects.archived, true),
		columns: { id: true }
	});

	return { user: locals.user, projects: active, archivedCount: archived.length };
};
