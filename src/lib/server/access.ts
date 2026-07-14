import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { projectMembers } from '$lib/server/db/schema';
import type { SessionUser } from '$lib/server/auth';

// For now every mutation is admin-only (regular users are read-only). This will
// be relaxed later into finer permissions.
export function requireAdmin(user: SessionUser | null): void {
	if (!user?.isAdmin) throw error(403, 'No autorizado');
}

export async function isMember(userId: number, projectId: number): Promise<boolean> {
	const [row] = await db
		.select({ id: projectMembers.id })
		.from(projectMembers)
		.where(and(eq(projectMembers.userId, userId), eq(projectMembers.projectId, projectId)));
	return !!row;
}

// Project ids a non-admin user is a member of.
export async function memberProjectIds(userId: number): Promise<number[]> {
	const rows = await db
		.select({ projectId: projectMembers.projectId })
		.from(projectMembers)
		.where(eq(projectMembers.userId, userId));
	return rows.map((r) => r.projectId);
}

// True if the user may SEE this project (admin, or a member).
export async function canSeeProject(user: SessionUser | null, projectId: number): Promise<boolean> {
	if (!user) return false;
	if (user.isAdmin) return true;
	return isMember(user.id, projectId);
}
