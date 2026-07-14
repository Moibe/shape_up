import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user?.isAdmin) throw redirect(303, '/');

	const list = await db
		.select({
			id: users.id,
			username: users.username,
			isAdmin: users.isAdmin,
			createdAt: users.createdAt
		})
		.from(users)
		.orderBy(asc(users.username));
	return { users: list };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) throw redirect(303, '/');

		const fd = await request.formData();
		const username = String(fd.get('username') ?? '').trim();
		const password = String(fd.get('password') ?? '');
		const makeAdmin = fd.get('isAdmin') != null;
		if (!username) return fail(400, { createError: 'El usuario es obligatorio.', username });
		if (password.length < 4) {
			return fail(400, { createError: 'La contraseña debe tener al menos 4 caracteres.', username });
		}
		try {
			await db
				.insert(users)
				.values({ username, passwordHash: hashPassword(password), isAdmin: makeAdmin });
		} catch {
			return fail(409, { createError: `El usuario "${username}" ya existe.`, username });
		}
		return { created: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) throw redirect(303, '/');

		const userId = Number((await request.formData()).get('userId'));
		if (!Number.isInteger(userId)) return fail(400, { deleteError: 'Usuario inválido.' });
		if (locals.user?.id === userId) {
			return fail(409, { deleteError: 'No puedes borrar tu propio usuario.' });
		}
		await db.delete(users).where(eq(users.id, userId));
		return { deleted: true };
	}
};
