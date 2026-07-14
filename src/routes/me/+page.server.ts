import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users, projects, projectMembers } from '$lib/server/db/schema';
import { verifyPassword, hashPassword } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	const me = locals.user!;
	const [row] = await db
		.select({ createdAt: users.createdAt })
		.from(users)
		.where(eq(users.id, me.id));

	// Projects the user is in: admins are effectively in all; regular users only
	// their memberships.
	let projectNames: string[];
	if (me.isAdmin) {
		const rows = await db
			.select({ name: projects.name })
			.from(projects)
			.where(eq(projects.archived, false))
			.orderBy(asc(projects.name));
		projectNames = rows.map((r) => r.name);
	} else {
		const rows = await db
			.select({ name: projects.name })
			.from(projectMembers)
			.innerJoin(projects, eq(projectMembers.projectId, projects.id))
			.where(eq(projectMembers.userId, me.id))
			.orderBy(asc(projects.name));
		projectNames = rows.map((r) => r.name);
	}

	return { username: me.username, isAdmin: me.isAdmin, createdAt: row?.createdAt ?? null, projectNames };
};

export const actions: Actions = {
	changePassword: async ({ request, locals }) => {
		const me = locals.user!;
		const fd = await request.formData();
		const current = String(fd.get('current') ?? '');
		const next = String(fd.get('next') ?? '');
		const confirm = String(fd.get('confirm') ?? '');

		if (next.length < 4) {
			return fail(400, { pwError: 'La nueva contraseña debe tener al menos 4 caracteres.' });
		}
		if (next !== confirm) return fail(400, { pwError: 'Las contraseñas nuevas no coinciden.' });

		const [row] = await db
			.select({ passwordHash: users.passwordHash })
			.from(users)
			.where(eq(users.id, me.id));
		if (!row || !verifyPassword(current, row.passwordHash)) {
			return fail(400, { pwError: 'La contraseña actual es incorrecta.' });
		}

		await db.update(users).set({ passwordHash: hashPassword(next) }).where(eq(users.id, me.id));
		return { pwChanged: true };
	}
};
