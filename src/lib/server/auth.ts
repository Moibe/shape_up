import type { Cookies } from '@sveltejs/kit';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';

// SvelteKit's cookies.set() defaults `secure` to true unless the request host is
// literally "localhost" — so on a real deployment reached over plain HTTP by IP
// (no TLS yet), the browser silently drops the Set-Cookie header and login just
// bounces back with no visible error. Derive it from ORIGIN (the deploy's own
// declared scheme) instead: https:// deploys keep Secure, http:// ones don't.
const SECURE_COOKIES = (env.ORIGIN ?? '').startsWith('https://');

const DAY = 1000 * 60 * 60 * 24;
const SESSION_TTL = 30 * DAY;
const REFRESH_THRESHOLD = 15 * DAY; // extend when less than this remains
export const SESSION_COOKIE = 'session';

export type SessionUser = { id: number; username: string; isAdmin: boolean };

// ── Passwords (scrypt, salt:hash hex) ────────────────────────────────────────
export function hashPassword(password: string): string {
	const salt = randomBytes(16);
	const hash = scryptSync(password, salt, 64);
	return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
	const [saltHex, hashHex] = stored.split(':');
	if (!saltHex || !hashHex) return false;
	const hash = scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
	const expected = Buffer.from(hashHex, 'hex');
	return hash.length === expected.length && timingSafeEqual(hash, expected);
}

// ── Sessions ─────────────────────────────────────────────────────────────────
export function generateSessionToken(): string {
	return randomBytes(32).toString('base64url');
}

// The cookie holds the raw token; the DB stores only its SHA-256, so a DB leak
// can't be used to impersonate.
const sessionId = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(token: string, userId: number) {
	const id = sessionId(token);
	const expiresAt = Date.now() + SESSION_TTL;
	await db.insert(sessions).values({ id, userId, expiresAt });
	return { id, userId, expiresAt };
}

export async function validateSessionToken(
	token: string
): Promise<{ session: { id: string; userId: number; expiresAt: number } | null; user: SessionUser | null }> {
	const id = sessionId(token);
	const [row] = await db.select().from(sessions).where(eq(sessions.id, id));
	if (!row) return { session: null, user: null };

	if (Date.now() >= row.expiresAt) {
		await db.delete(sessions).where(eq(sessions.id, id));
		return { session: null, user: null };
	}

	let expiresAt = row.expiresAt;
	if (Date.now() >= row.expiresAt - REFRESH_THRESHOLD) {
		expiresAt = Date.now() + SESSION_TTL;
		await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
	}

	const [u] = await db
		.select({ id: users.id, username: users.username, isAdmin: users.isAdmin })
		.from(users)
		.where(eq(users.id, row.userId));
	if (!u) {
		await db.delete(sessions).where(eq(sessions.id, id));
		return { session: null, user: null };
	}

	return { session: { id, userId: row.userId, expiresAt }, user: u };
}

export async function invalidateSession(id: string) {
	await db.delete(sessions).where(eq(sessions.id, id));
}

export function setSessionCookie(cookies: Cookies, token: string, expiresAt: number) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: SECURE_COOKIES,
		expires: new Date(expiresAt)
	});
}

export function deleteSessionCookie(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
