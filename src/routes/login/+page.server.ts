import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import {
	verifyPassword,
	generateSessionToken,
	createSession,
	setSessionCookie
} from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const fd = await request.formData();
		const username = String(fd.get('username') ?? '').trim();
		const password = String(fd.get('password') ?? '');
		if (!username || !password) return fail(400, { error: 'Escribe usuario y contraseña.', username });

		const [u] = await db.select().from(users).where(eq(users.username, username));
		// Verify even on unknown user is skipped; message is generic to avoid leaking
		// which usernames exist.
		if (!u || !verifyPassword(password, u.passwordHash)) {
			return fail(400, { error: 'Usuario o contraseña incorrectos.', username });
		}

		const token = generateSessionToken();
		const session = await createSession(token, u.id);
		setSessionCookie(cookies, token, session.expiresAt);
		throw redirect(303, '/');
	}
};
