import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';

// Create a project directly (without going through a pitch). Lands on its dashboard.
export const actions: Actions = {
	default: async ({ request }) => {
		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		const notes = String(fd.get('notes') ?? '').trim();
		if (!name) return fail(400, { error: 'El nombre es obligatorio.', values: { name, notes } });

		const [c] = await db
			.insert(projects)
			.values({ name, notes: notes || null })
			.returning({ id: projects.id });

		throw redirect(303, `/project/${c.id}`);
	}
};
