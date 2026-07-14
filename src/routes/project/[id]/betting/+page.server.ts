import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { and, eq, isNull } from 'drizzle-orm';
import { pitches } from '$lib/server/db/schema';
import { resolveProject } from '$lib/server/project-context';
import { requireAdmin } from '$lib/server/access';
import { derivePitchDates, todayIso, buildDays } from '$lib/server/pitch-dates';

// Betting Table (per-pitch model): this project's shaped pitches. Betting = start
// building, which gives the pitch its own clock (build + cooldown from today).
export const load: PageServerLoad = async ({ params, locals }) => {
	const world = await resolveProject(params.id, locals.user);
	const projectMatch =
		world.projectId === null ? isNull(pitches.projectId) : eq(pitches.projectId, world.projectId);

	const shaped = await db.query.pitches.findMany({
		where: and(eq(pitches.status, 'shaped'), projectMatch),
		with: { scopes: true, nogos: true },
		orderBy: (p, { desc }) => [desc(p.createdAt)]
	});

	return { world, shaped };
};

export const actions: Actions = {
	// Start building a shaped pitch: sets its own build/cooldown clock from today.
	start: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const world = await resolveProject(params.id, locals.user);

		const raw = (await request.formData()).get('pitchId');
		const pitchId = Number(raw);
		if (raw === null || !Number.isInteger(pitchId) || pitchId <= 0) {
			return fail(400, { betError: 'Pitch inválido.' });
		}

		const pitch = await db.query.pitches.findFirst({ where: eq(pitches.id, pitchId) });
		if (!pitch) return fail(404, { betError: 'Ese pitch ya no existe.' });
		if (pitch.projectId !== world.projectId) {
			return fail(409, { betError: 'Ese pitch no pertenece a este proyecto.' });
		}
		if (pitch.status !== 'shaped') {
			return fail(409, { betError: 'Ese pitch ya no está disponible para arrancar.' });
		}

		const dates = derivePitchDates(todayIso(), pitch.appetite);
		// Atomic guard: only the request that still sees it shaped wins.
		const res = await db
			.update(pitches)
			.set({
				status: 'building',
				buildStartDate: dates.buildStartDate,
				buildEndDate: dates.buildEndDate,
				cooldownEndDate: dates.cooldownEndDate
			})
			.where(and(eq(pitches.id, pitchId), eq(pitches.status, 'shaped')));
		if (res.changes === 0) {
			return fail(409, { betError: 'Ese pitch ya no está disponible para arrancar.' });
		}

		return { startedPitchId: pitchId, startedTitle: pitch.title, weeks: buildDays(pitch.appetite) / 7 };
	}
};
