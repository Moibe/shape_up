import type { Handle } from '@sveltejs/kit';
import {
	SESSION_COOKIE,
	validateSessionToken,
	setSessionCookie,
	deleteSessionCookie
} from '$lib/server/auth';

// Populate locals.user/session from the session cookie on every request. The
// route guard (redirect to /login) lives in the root +layout.server.ts.
export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	if (!token) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(token);
	if (session && user) {
		setSessionCookie(event.cookies, token, session.expiresAt); // keep cookie fresh
		event.locals.user = user;
		event.locals.session = session;
	} else {
		deleteSessionCookie(event.cookies);
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};
