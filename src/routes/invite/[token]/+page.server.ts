import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import {
	validateInviteToken,
	consumeInvitesForUser,
	hashPassword,
	generateSessionToken,
	createSession,
	setSessionCookie
} from '$lib/server/auth';

// Link de invitación de un solo uso: el usuario activa su cuenta poniendo su
// propia contraseña. Ruta pública (sin sesión) — ver excepción en +layout.server.ts.
export const load: PageServerLoad = async ({ params, locals }) => {
	// Ya tiene sesión (p.ej. un admin abrió por error el link de otra persona):
	// no seguimos, para no arriesgar reemplazar su sesión activa por la del invitado.
	if (locals.user) return { alreadyLoggedIn: true, username: null };

	const invite = await validateInviteToken(params.token);
	if (!invite) throw error(404, 'Este link de invitación no es válido o ya expiró.');

	return { alreadyLoggedIn: false, username: invite.username };
};

export const actions: Actions = {
	default: async ({ params, request, cookies, locals }) => {
		if (locals.user) {
			return fail(409, { error: 'Ya tienes una sesión activa. Cierra sesión primero para usar este link.' });
		}

		const invite = await validateInviteToken(params.token);
		if (!invite) throw error(404, 'Este link de invitación no es válido o ya expiró.');

		const fd = await request.formData();
		const password = String(fd.get('password') ?? '');
		const confirm = String(fd.get('confirm') ?? '');
		if (password.length < 4) {
			return fail(400, { error: 'La contraseña debe tener al menos 4 caracteres.' });
		}
		if (password !== confirm) {
			return fail(400, { error: 'Las contraseñas no coinciden.' });
		}

		await db
			.update(users)
			.set({ passwordHash: hashPassword(password) })
			.where(eq(users.id, invite.userId));
		await consumeInvitesForUser(invite.userId);

		// Activar la cuenta la deja lista para entrar de una vez.
		const token = generateSessionToken();
		const session = await createSession(token, invite.userId);
		setSessionCookie(cookies, token, session.expiresAt);
		throw redirect(303, '/');
	}
};
