import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, type Project } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export type ProjectWorld = {
	projectId: number | null; // null = internal work
	project: Project | null;
	label: string;
};

// Resolve the [id] route segment into a project "world". The literal 'internal'
// maps to the no-project bucket; anything else must be an existing project id.
export async function resolveProject(param: string): Promise<ProjectWorld> {
	if (param === 'internal') {
		return { projectId: null, project: null, label: 'Trabajo interno' };
	}
	const id = Number(param);
	if (!Number.isInteger(id) || id <= 0) throw error(404, 'Proyecto no encontrado');
	const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
	if (!project) throw error(404, 'Proyecto no encontrado');
	return { projectId: id, project, label: project.name };
}
