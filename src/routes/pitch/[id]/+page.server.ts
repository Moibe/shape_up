import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { and, eq, sql } from 'drizzle-orm';
import {
	nogos,
	rabbitHoles,
	pitches,
	scopes,
	type ScopeStatus,
	type Appetite,
	type PitchStatus
} from '$lib/server/db/schema';
import { pitchClock } from '$lib/server/pitch-dates';
import { requireAdmin, isMember } from '$lib/server/access';

// Pitch Detail: read the pitch with its relations, plus inline CRUD for its
// scopes and no-gos. Viewing needs project visibility; all writes are admin-only.
export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(404, 'Pitch no encontrado');

	const pitch = await db.query.pitches.findFirst({
		where: eq(pitches.id, id),
		with: {
			project: true,
			nogos: true,
			rabbitHoles: true,
			scopes: { orderBy: (s, { asc }) => [asc(s.sortOrder)] }
		}
	});

	if (!pitch) throw error(404, 'Pitch no encontrado');

	const canSee =
		locals.user?.isAdmin ||
		(pitch.projectId != null && !!locals.user && (await isMember(locals.user.id, pitch.projectId)));
	if (!canSee) throw error(404, 'Pitch no encontrado');

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
	// Inline per-field edit (the ✎ on each section). One field at a time.
	updateField: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = pitchId(params);
		const current = await db.query.pitches.findFirst({ where: eq(pitches.id, id) });
		if (!current) throw error(404, 'Pitch no encontrado');

		const fd = await request.formData();
		const field = String(fd.get('field') ?? '');
		const value = String(fd.get('value') ?? '').trim();

		switch (field) {
			case 'title':
				if (!value) return fail(400, { fieldError: 'El título es obligatorio.', field });
				await db.update(pitches).set({ title: value }).where(eq(pitches.id, id));
				break;
			case 'problem':
				if (!value) return fail(400, { fieldError: 'Describe el problema.', field });
				await db.update(pitches).set({ problem: value }).where(eq(pitches.id, id));
				break;
			case 'appetite':
				if (value !== 'small' && value !== 'big')
					return fail(400, { fieldError: 'Tamaño inválido.', field });
				await db.update(pitches).set({ appetite: value as Appetite }).where(eq(pitches.id, id));
				break;
			case 'solutionSketch':
				await db.update(pitches).set({ solutionSketch: value || null }).where(eq(pitches.id, id));
				break;
			case 'dataModel':
				await db.update(pitches).set({ dataModel: value || null }).where(eq(pitches.id, id));
				break;
			case 'dataModelDiagram': {
				// JSON del diagrama ER (o vacío => null). Validamos que parsee.
				if (value) {
					try {
						JSON.parse(value);
					} catch {
						return fail(400, { fieldError: 'Diagrama inválido.', field });
					}
				}
				await db
					.update(pitches)
					.set({ dataModelDiagram: value || null })
					.where(eq(pitches.id, id));
				break;
			}
			case 'status': {
				if (current.status === 'building' || current.status === 'done') {
					return fail(409, { fieldError: 'El estado se gestiona por acciones, no aquí.', field });
				}
				if (!['draft', 'shaped', 'rejected'].includes(value)) {
					return fail(400, { fieldError: 'Estado inválido.', field });
				}
				await db.update(pitches).set({ status: value as PitchStatus }).where(eq(pitches.id, id));
				break;
			}
			default:
				return fail(400, { fieldError: 'Campo inválido.', field });
		}
		return { fieldSaved: field };
	},

	// Delete the whole pitch (moved here from the old edit page).
	deletePitch: async ({ params, locals }) => {
		requireAdmin(locals.user);
		const id = pitchId(params);
		const p = await db.query.pitches.findFirst({
			where: eq(pitches.id, id),
			columns: { projectId: true }
		});
		// FK cascade removes its scopes and nogos.
		await db.delete(pitches).where(eq(pitches.id, id));
		throw redirect(303, p?.projectId != null ? `/project/${p.projectId}` : '/');
	},

	// Close the pitch: building → done.
	finish: async ({ params, locals }) => {
		requireAdmin(locals.user);
		const id = pitchId(params);
		await db
			.update(pitches)
			.set({ status: 'done' })
			.where(and(eq(pitches.id, id), eq(pitches.status, 'building')));
		return { finished: true };
	},

	// Hill chart drag: persist a scope's hill_position and derive its status.
	setHill: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
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

	addScope: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = pitchId(params);
		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		const isCore = fd.get('isCore') != null;
		if (!name) return fail(400, { scopeError: 'El scope necesita un nombre.' });

		const [{ max }] = await db
			.select({ max: sql<number | null>`max(${scopes.sortOrder})` })
			.from(scopes)
			.where(eq(scopes.pitchId, id));

		await db.insert(scopes).values({ pitchId: id, name, isCore, sortOrder: (max ?? -1) + 1 });
		return { scopeAdded: true };
	},

	updateScope: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
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

	deleteScope: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = pitchId(params);
		const scopeId = Number((await request.formData()).get('scopeId'));
		if (!Number.isInteger(scopeId)) throw error(400, 'Scope inválido');
		await db.delete(scopes).where(and(eq(scopes.id, scopeId), eq(scopes.pitchId, id)));
		return { scopeDeleted: true };
	},

	// Scope hammering: cut a scope out of the build (status = 'cut').
	cutScope: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
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
	restoreScope: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
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

	addNogo: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = pitchId(params);
		const text = String((await request.formData()).get('text') ?? '').trim();
		if (!text) return fail(400, { nogoError: 'Escribe el no-go.' });
		await db.insert(nogos).values({ pitchId: id, text });
		return { nogoAdded: true };
	},

	deleteNogo: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = pitchId(params);
		const nogoId = Number((await request.formData()).get('nogoId'));
		if (!Number.isInteger(nogoId)) throw error(400, 'No-go inválido');
		await db.delete(nogos).where(and(eq(nogos.id, nogoId), eq(nogos.pitchId, id)));
		return { nogoDeleted: true };
	},

	addRabbitHole: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = pitchId(params);
		const text = String((await request.formData()).get('text') ?? '').trim();
		if (!text) return fail(400, { rabbitHoleError: 'Escribe el rabbit hole.' });
		await db.insert(rabbitHoles).values({ pitchId: id, text });
		return { rabbitHoleAdded: true };
	},

	deleteRabbitHole: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = pitchId(params);
		const rabbitHoleId = Number((await request.formData()).get('rabbitHoleId'));
		if (!Number.isInteger(rabbitHoleId)) throw error(400, 'Rabbit hole inválido');
		await db
			.delete(rabbitHoles)
			.where(and(eq(rabbitHoles.id, rabbitHoleId), eq(rabbitHoles.pitchId, id)));
		return { rabbitHoleDeleted: true };
	}
};
