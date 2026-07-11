import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { sqliteTable, integer, text, check } from 'drizzle-orm/sqlite-core';

// ─────────────────────────────────────────────────────────────────────────────
// Shape Up domain schema (per-pitch time model). Cardinalities are the source of
// truth: projects 1:N pitches, pitches 1:N scopes, pitches 1:N nogos, scopes 1:N
// tasks. There is NO shared cycle: each pitch carries its own build/cooldown clock
// (build = start + appetite; cooldown = build_end + cooldown). Do not loosen these.
// ─────────────────────────────────────────────────────────────────────────────

// Enum domains — single source of truth for both the column definitions and
// server-side validation. Import these instead of re-typing the string literals.
export const APPETITES = ['small', 'big'] as const;
export const PITCH_STATUSES = ['draft', 'shaped', 'building', 'done', 'rejected'] as const;
export const SCOPE_STATUSES = ['uphill', 'downhill', 'done', 'cut'] as const;

export type Appetite = (typeof APPETITES)[number];
export type PitchStatus = (typeof PITCH_STATUSES)[number];
export type ScopeStatus = (typeof SCOPE_STATUSES)[number];

export const projects = sqliteTable('projects', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	notes: text('notes'),
	// Soft-delete: a project with pitches is archived (hidden, reversible) instead
	// of destroyed. Empty projects are hard-deleted.
	archived: integer('archived', { mode: 'boolean' }).notNull().default(false)
});

export const pitches = sqliteTable(
	'pitches',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		title: text('title').notNull(),
		// The problem, not the solution.
		problem: text('problem').notNull(),
		// small = 2 weeks, big = 6 weeks. No intermediate values.
		appetite: text('appetite', { enum: APPETITES }).notNull(),
		// Fat-marker sketch, deliberately abstract.
		solutionSketch: text('solution_sketch'),
		// MVP: the pitch's data model as structured Markdown (entities + relations +
		// cardinalities). Phase 2 would promote this to first-class relational data.
		dataModel: text('data_model'),
		status: text('status', { enum: PITCH_STATUSES }).notNull().default('draft'),
		// Nullable: internal work has no project.
		projectId: integer('project_id').references(() => projects.id),
		// Per-pitch clock (ISO dates). NULL until the pitch is started (building).
		// build_end = build_start + appetite; cooldown_end = build_end + cooldown.
		// The dates are the source of truth for the current phase (build/cooldown).
		buildStartDate: text('build_start_date'),
		buildEndDate: text('build_end_date'),
		cooldownEndDate: text('cooldown_end_date'),
		createdAt: text('created_at')
			.notNull()
			.default(sql`(datetime('now'))`)
	},
	(t) => [
		check('pitches_appetite_ck', sql`${t.appetite} IN ('small','big')`),
		check('pitches_status_ck', sql`${t.status} IN ('draft','shaped','building','done','rejected')`)
	]
);

export const nogos = sqliteTable('nogos', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	// First-class rows, not free text buried in the pitch.
	pitchId: integer('pitch_id')
		.notNull()
		.references(() => pitches.id, { onDelete: 'cascade' }),
	text: text('text').notNull()
});

export const scopes = sqliteTable(
	'scopes',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		pitchId: integer('pitch_id')
			.notNull()
			.references(() => pitches.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		// 0..50 uphill (figuring out), 50..100 downhill (executing). 50 = the crest.
		hillPosition: integer('hill_position').notNull().default(0),
		// 0 = "nice to have", candidate for scope hammering.
		isCore: integer('is_core', { mode: 'boolean' }).notNull().default(true),
		status: text('status', { enum: SCOPE_STATUSES }).notNull().default('uphill'),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [
		check('scopes_hill_ck', sql`${t.hillPosition} BETWEEN 0 AND 100`),
		check('scopes_status_ck', sql`${t.status} IN ('uphill','downhill','done','cut')`)
	]
);

export const tasks = sqliteTable('tasks', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	scopeId: integer('scope_id')
		.notNull()
		.references(() => scopes.id, { onDelete: 'cascade' }),
	text: text('text').notNull(),
	done: integer('done', { mode: 'boolean' }).notNull().default(false)
});

// ─────────────────────────────────────────────────────────────────────────────
// Relations — mirror the cardinalities above for typed relational queries.
// ─────────────────────────────────────────────────────────────────────────────

export const projectsRelations = relations(projects, ({ many }) => ({
	pitches: many(pitches)
}));

export const pitchesRelations = relations(pitches, ({ one, many }) => ({
	project: one(projects, { fields: [pitches.projectId], references: [projects.id] }),
	scopes: many(scopes),
	nogos: many(nogos)
}));

export const nogosRelations = relations(nogos, ({ one }) => ({
	pitch: one(pitches, { fields: [nogos.pitchId], references: [pitches.id] })
}));

export const scopesRelations = relations(scopes, ({ one, many }) => ({
	pitch: one(pitches, { fields: [scopes.pitchId], references: [pitches.id] }),
	tasks: many(tasks)
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
	scope: one(scopes, { fields: [tasks.scopeId], references: [scopes.id] })
}));

// ─────────────────────────────────────────────────────────────────────────────
// Inferred types — use these across load functions and actions.
// ─────────────────────────────────────────────────────────────────────────────

export type Project = typeof projects.$inferSelect;
export type Pitch = typeof pitches.$inferSelect;
export type Nogo = typeof nogos.$inferSelect;
export type Scope = typeof scopes.$inferSelect;
export type Task = typeof tasks.$inferSelect;
