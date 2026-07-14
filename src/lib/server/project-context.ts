import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, type Project } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { SessionUser } from '$lib/server/auth';
import { isMember } from '$lib/server/access';

export type ProjectWorld = {
	projectId: number | null; // null = internal work
	project: Project | null;
	label: string;
};

// Resolve the [id] route segment into a project "world" AND enforce visibility:
// admins see any project; regular users only projects they're a member of.
// Unauthorized / missing → 404 (don't leak existence). Internal work is admin-only.
export async function resolveProject(param: string, user: SessionUser | null): Promise<ProjectWorld> {
	if (param === 'internal') {
		if (!user?.isAdmin) throw error(404, 'Proyecto no encontrado');
		return { projectId: null, project: null, label: 'Trabajo interno' };
	}

	const id = Number(param);
	if (!Number.isInteger(id) || id <= 0) throw error(404, 'Proyecto no encontrado');

	const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
	if (!project) throw error(404, 'Proyecto no encontrado');

	const allowed = user?.isAdmin || (user ? await isMember(user.id, id) : false);
	if (!allowed) throw error(404, 'Proyecto no encontrado');

	return { projectId: id, project, label: project.name };
}
