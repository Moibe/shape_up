import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, pitches, users, projectMembers } from '$lib/server/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { requireAdmin } from '$lib/server/access';

// Project settings — admin only. Rename, archive/delete, and membership (who can
// see the project).
export const load: PageServerLoad = async ({ params, locals }) => {
	requireAdmin(locals.user);

	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(404, 'Proyecto no encontrado');

	const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
	if (!project) throw error(404, 'Proyecto no encontrado');

	const pitchRows = await db.query.pitches.findMany({
		where: eq(pitches.projectId, id),
		columns: { id: true }
	});

	const memberRows = await db
		.select({ userId: projectMembers.userId })
		.from(projectMembers)
		.where(eq(projectMembers.projectId, id));
	const memberIds = new Set(memberRows.map((r) => r.userId));

	const allUsers = await db
		.select({ id: users.id, username: users.username, isAdmin: users.isAdmin })
		.from(users)
		.orderBy(asc(users.username));

	// Admins see everything already, so they aren't offered as members.
	const members = allUsers.filter((u) => memberIds.has(u.id));
	const candidates = allUsers.filter((u) => !u.isAdmin && !memberIds.has(u.id));

	return { project, pitchCount: pitchRows.length, members, candidates };
};

function projectId(params: { id: string }): number {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(404, 'Proyecto no encontrado');
	return id;
}

export const actions: Actions = {
	rename: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = projectId(params);
		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		const notes = String(fd.get('notes') ?? '').trim();
		if (!name) return fail(400, { nameError: 'El nombre es obligatorio.' });
		await db.update(projects).set({ name, notes: notes || null }).where(eq(projects.id, id));
		throw redirect(303, `/project/${id}`);
	},

	archive: async ({ params, locals }) => {
		requireAdmin(locals.user);
		const id = projectId(params);
		await db.update(projects).set({ archived: true }).where(eq(projects.id, id));
		throw redirect(303, '/');
	},

	// Permanent, and ONLY for an empty project.
	delete: async ({ params, locals }) => {
		requireAdmin(locals.user);
		const id = projectId(params);
		const hasPitches = await db.query.pitches.findFirst({
			where: eq(pitches.projectId, id),
			columns: { id: true }
		});
		if (hasPitches) {
			return fail(409, {
				deleteError:
					'No se puede borrar mientras tenga pitches. Borra sus pitches primero, o usa Archivar.'
			});
		}
		try {
			await db.delete(projects).where(eq(projects.id, id));
		} catch {
			return fail(409, {
				deleteError: 'No se pudo borrar: el proyecto tiene contenido asociado. Archívalo mejor.'
			});
		}
		throw redirect(303, '/');
	},

	addMember: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = projectId(params);
		const userId = Number((await request.formData()).get('userId'));
		if (!Number.isInteger(userId)) return fail(400, { memberError: 'Usuario inválido.' });
		await db.insert(projectMembers).values({ projectId: id, userId }).onConflictDoNothing();
		return { memberAdded: true };
	},

	removeMember: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = projectId(params);
		const userId = Number((await request.formData()).get('userId'));
		if (!Number.isInteger(userId)) return fail(400, { memberError: 'Usuario inválido.' });
		await db
			.delete(projectMembers)
			.where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, userId)));
		return { memberRemoved: true };
	}
};
