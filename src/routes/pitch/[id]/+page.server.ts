import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { and, eq, sql } from 'drizzle-orm';
import { nogos, pitches, scopes, type ScopeStatus } from '$lib/server/db/schema';
import { pitchClock } from '$lib/server/pitch-dates';

// Pitch Detail: read the pitch with its relations, plus inline CRUD for its
// scopes and no-gos (first-class children of the pitch).
export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(404, 'Pitch no encontrado');

	const pitch = await db.query.pitches.findFirst({
		where: eq(pitches.id, id),
		with: {
			project: true,
			nogos: true,
			scopes: { orderBy: (s, { asc }) => [asc(s.sortOrder)] }
		}
	});

	if (!pitch) throw error(404, 'Pitch no encontrado');

	// Per-pitch clock (build/cooldown phase), derived from its dates.
	const clock = pitch.status === 'building' ? pitchClock(pitch) : null;

	return { pitch, clock };
};

// Resolve + validate the pitch id from the route; 404 otherwise.
function pitchId(params: { id: string }): number {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(404, 'Pitch no encontrado');
	return id;
}

// Derive a scope's status from its hill position (0..50 uphill, 50..100 downhill,
// 100 done). Used when restoring a cut scope back onto the hill.
function statusFromHill(hill: number): ScopeStatus {
	if (hill >= 100) return 'done';
	if (hill >= 50) return 'downhill';
	return 'uphill';
}

export const actions: Actions = {
	// Close the pitch: building → done. The date was a ceiling, not a floor —
	// finishing (early or on time) is explicit.
	finish: async ({ params }) => {
		const id = pitchId(params);
		await db
			.update(pitches)
			.set({ status: 'done' })
			.where(and(eq(pitches.id, id), eq(pitches.status, 'building')));
		return { finished: true };
	},

	// Hill chart drag: persist a scope's hill_position and derive its status
	// (crossing 50 → downhill, reaching 100 → done). Cut scopes stay put.
	setHill: async ({ request, params }) => {
		const id = pitchId(params);
		const fd = await request.formData();
		const scopeId = Number(fd.get('scopeId'));
		const raw = Number(fd.get('hillPosition'));
		if (!Number.isInteger(scopeId)) throw error(400, 'Scope inválido');
		if (!Number.isFinite(raw)) return fail(400, { hillError: 'Posición inválida.' });
		const hill = Math.max(0, Math.min(100, Math.round(raw)));

		const scope = await db.query.scopes.findFirst({
			where: and(eq(scopes.id, scopeId), eq(scopes.pitchId, id))
		});
		if (!scope) throw error(404, 'Scope no encontrado');
		if (scope.status === 'cut') return fail(409, { hillError: 'Un scope cortado no se mueve.' });

		await db
			.update(scopes)
			.set({ hillPosition: hill, status: statusFromHill(hill) })
			.where(and(eq(scopes.id, scopeId), eq(scopes.pitchId, id)));
		return { hillMoved: true };
	},

	addScope: async ({ request, params }) => {
		const id = pitchId(params);
		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		const isCore = fd.get('isCore') != null;
		if (!name) return fail(400, { scopeError: 'El scope necesita un nombre.' });

		const [{ max }] = await db
			.select({ max: sql<number | null>`max(${scopes.sortOrder})` })
			.from(scopes)
			.where(eq(scopes.pitchId, id));

		await db.insert(scopes).values({
			pitchId: id,
			name,
			isCore,
			sortOrder: (max ?? -1) + 1
		});
		return { scopeAdded: true };
	},

	updateScope: async ({ request, params }) => {
		const id = pitchId(params);
		const fd = await request.formData();
		const scopeId = Number(fd.get('scopeId'));
		const name = String(fd.get('name') ?? '').trim();
		const isCore = fd.get('isCore') != null;
		const sortOrder = Number(fd.get('sortOrder'));
		if (!Number.isInteger(scopeId)) throw error(400, 'Scope inválido');
		if (!name) return fail(400, { scopeError: 'El scope necesita un nombre.' });

		await db
			.update(scopes)
			.set({ name, isCore, sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0 })
			.where(and(eq(scopes.id, scopeId), eq(scopes.pitchId, id)));
		return { scopeUpdated: true };
	},

	deleteScope: async ({ request, params }) => {
		const id = pitchId(params);
		const scopeId = Number((await request.formData()).get('scopeId'));
		if (!Number.isInteger(scopeId)) throw error(400, 'Scope inválido');
		await db.delete(scopes).where(and(eq(scopes.id, scopeId), eq(scopes.pitchId, id)));
		return { scopeDeleted: true };
	},

	// Scope hammering: cut a scope out of the build (status = 'cut').
	cutScope: async ({ request, params }) => {
		const id = pitchId(params);
		const scopeId = Number((await request.formData()).get('scopeId'));
		if (!Number.isInteger(scopeId)) throw error(400, 'Scope inválido');
		await db
			.update(scopes)
			.set({ status: 'cut' })
			.where(and(eq(scopes.id, scopeId), eq(scopes.pitchId, id)));
		return { scopeCut: true };
	},

	// Put a cut scope back on the hill; its status follows its hill position.
	restoreScope: async ({ request, params }) => {
		const id = pitchId(params);
		const scopeId = Number((await request.formData()).get('scopeId'));
		if (!Number.isInteger(scopeId)) throw error(400, 'Scope inválido');
		const scope = await db.query.scopes.findFirst({
			where: and(eq(scopes.id, scopeId), eq(scopes.pitchId, id))
		});
		if (!scope) throw error(404, 'Scope no encontrado');
		await db
			.update(scopes)
			.set({ status: statusFromHill(scope.hillPosition) })
			.where(eq(scopes.id, scopeId));
		return { scopeRestored: true };
	},

	addNogo: async ({ request, params }) => {
		const id = pitchId(params);
		const text = String((await request.formData()).get('text') ?? '').trim();
		if (!text) return fail(400, { nogoError: 'Escribe el no-go.' });
		await db.insert(nogos).values({ pitchId: id, text });
		return { nogoAdded: true };
	},

	deleteNogo: async ({ request, params }) => {
		const id = pitchId(params);
		const nogoId = Number((await request.formData()).get('nogoId'));
		if (!Number.isInteger(nogoId)) throw error(400, 'No-go inválido');
		await db.delete(nogos).where(and(eq(nogos.id, nogoId), eq(nogos.pitchId, id)));
		return { nogoDeleted: true };
	}
};
