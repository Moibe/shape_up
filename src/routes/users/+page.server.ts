import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { generateInviteToken, createInvite } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user?.isAdmin) throw redirect(303, '/');

	const list = await db
		.select({
			id: users.id,
			username: users.username,
			isAdmin: users.isAdmin,
			createdAt: users.createdAt,
			passwordHash: users.passwordHash
		})
		.from(users)
		.orderBy(asc(users.username));
	// pendingActivation: el admin lo creó pero todavía no abre su invitación para
	// poner su propia contraseña. El hash nunca se manda al cliente.
	return {
		users: list.map(({ passwordHash, ...u }) => ({ ...u, pendingActivation: passwordHash === null }))
	};
};

export const actions: Actions = {
	// El admin NO pone contraseña: crea el usuario y genera un link de invitación
	// de un solo uso para que la persona misma active su cuenta.
	create: async ({ request, locals, url }) => {
		if (!locals.user?.isAdmin) throw redirect(303, '/');

		const fd = await request.formData();
		const username = String(fd.get('username') ?? '').trim();
		const makeAdmin = fd.get('isAdmin') != null;
		if (!username) return fail(400, { createError: 'El usuario es obligatorio.', username });

		let userId: number;
		try {
			const [row] = await db
				.insert(users)
				.values({ username, passwordHash: null, isAdmin: makeAdmin })
				.returning({ id: users.id });
			userId = row.id;
		} catch {
			return fail(409, { createError: `El usuario "${username}" ya existe.`, username });
		}

		const token = generateInviteToken();
		await createInvite(token, userId);
		return { created: true, inviteUrl: `${url.origin}/invite/${token}`, forUsername: username };
	},

	// Genera un nuevo link para un usuario que ya existe pero aún no activó su
	// cuenta (link perdido, expiró, etc.). No aplica si ya tiene contraseña.
	regenerateInvite: async ({ request, locals, url }) => {
		if (!locals.user?.isAdmin) throw redirect(303, '/');

		const userId = Number((await request.formData()).get('userId'));
		if (!Number.isInteger(userId)) return fail(400, { inviteError: 'Usuario inválido.' });

		const [u] = await db
			.select({ username: users.username, passwordHash: users.passwordHash })
			.from(users)
			.where(eq(users.id, userId));
		if (!u) return fail(404, { inviteError: 'Usuario no encontrado.' });
		if (u.passwordHash !== null) {
			return fail(409, { inviteError: 'Esa cuenta ya está activada, no necesita invitación.' });
		}

		const token = generateInviteToken();
		await createInvite(token, userId);
		return { created: true, inviteUrl: `${url.origin}/invite/${token}`, forUsername: u.username };
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
