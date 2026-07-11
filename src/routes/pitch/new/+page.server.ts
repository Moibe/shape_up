import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, pitches, type Appetite } from '$lib/server/db/schema';
import { readPitchForm, validatePitchForm } from '$lib/server/pitch-form';

export const load: PageServerLoad = async ({ url }) => {
	const projectList = await db.query.projects.findMany({
		orderBy: (c, { asc }) => [asc(c.name)]
	});
	// Preselect the project when coming from a project world (?project=<id>). Empty
	// (internal world) leaves it on "sin proyecto".
	const preProject = url.searchParams.get('project') ?? '';
	return { projects: projectList, preProject };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const v = readPitchForm(await request.formData());
		const errors = validatePitchForm(v);
		if (Object.keys(errors).length) return fail(400, { errors, values: v });

		// Resolve the project only after validation, so a bad submit never creates
		// an orphan project row.
		let projectId: number | null = null;
		if (v.projectId === '__new__') {
			const [c] = await db
				.insert(projects)
				.values({ name: v.newProjectName })
				.returning({ id: projects.id });
			projectId = c.id;
		} else if (v.projectId) {
			projectId = Number(v.projectId);
		}

		// New pitches start as drafts (still being shaped). Never bet from here —
		// that only happens via the betting table.
		const [p] = await db
			.insert(pitches)
			.values({
				title: v.title,
				problem: v.problem,
				appetite: v.appetite as Appetite,
				solutionSketch: v.solutionSketch || null,
				dataModel: v.dataModel || null,
				projectId,
				status: 'draft'
			})
			.returning({ id: pitches.id });

		throw redirect(303, `/pitch/${p.id}`);
	}
};
