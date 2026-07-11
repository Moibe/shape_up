import Database from 'better-sqlite3';

// Seed (per-pitch time model): a demo project with pitches in a few states —
// two building (their own clocks from today) and one shaped (betting table).
// Idempotent: no-op once any pitch exists. Demo data is TEMPORARY.
const url = process.env.DATABASE_URL ?? './local.db';
const db = new Database(url);
db.pragma('foreign_keys = ON');

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (startIso, n) => {
	const d = new Date(`${startIso}T00:00:00`);
	d.setDate(d.getDate() + n);
	return iso(d);
};
const buildDays = (a) => (a === 'small' ? 14 : 42);
const derive = (startIso, appetite) => {
	const buildEnd = addDays(startIso, buildDays(appetite));
	const cooldownEnd = addDays(buildEnd, Math.round(buildDays(appetite) / 3));
	return { buildEnd, cooldownEnd };
};

const pitchCount = db.prepare('SELECT COUNT(*) AS n FROM pitches').get().n;
if (pitchCount > 0) {
	console.log(`Seed skipped: ${pitchCount} pitch(es) already present.`);
	db.close();
	process.exit(0);
}

const today = iso(new Date());

const projectId = db
	.prepare(`INSERT INTO projects (name, notes) VALUES (?, ?)`)
	.run('Acme Corp', 'Proyecto demo — bórralo cuando metas datos reales.').lastInsertRowid;

const insertPitch = db.prepare(
	`INSERT INTO pitches (title, problem, appetite, solution_sketch, data_model, status, project_id, build_start_date, build_end_date, cooldown_end_date)
	 VALUES (@title, @problem, @appetite, @solution_sketch, @data_model, @status, @project_id, @build_start_date, @build_end_date, @cooldown_end_date)`
);
const insertNogo = db.prepare(`INSERT INTO nogos (pitch_id, text) VALUES (?, ?)`);
const insertScope = db.prepare(
	`INSERT INTO scopes (pitch_id, name, hill_position, is_core, status, sort_order)
	 VALUES (?, ?, ?, ?, ?, ?)`
);

// Pitch A — building (big), started today, scopes across the whole hill.
const aDates = derive(today, 'big');
const a = insertPitch.run({
	title: 'Rediseño del portal de proyecto',
	problem:
		'Los proyectos no encuentran sus entregables ni el estado de su proyecto; nos escriben por correo para todo.',
	appetite: 'big',
	solution_sketch:
		'Un portal con un panel por proyecto: estado, próximos hitos y archivos. Sin bandeja de mensajes.',
	data_model:
		'## Modelo de datos\n- **Project** 1:N **Milestone**\n- **Project** 1:N **Deliverable**\n- **Project** 1:N **Project**',
	status: 'building',
	project_id: projectId,
	build_start_date: today,
	build_end_date: aDates.buildEnd,
	cooldown_end_date: aDates.cooldownEnd
}).lastInsertRowid;
insertNogo.run(a, 'Sin app móvil nativa');
insertNogo.run(a, 'Sin integración SSO');
insertScope.run(a, 'Login y acceso', 100, 1, 'done', 0);
insertScope.run(a, 'Panel de proyecto', 65, 1, 'downhill', 1);
insertScope.run(a, 'Exportar reportes', 30, 1, 'uphill', 2);
insertScope.run(a, 'Modo oscuro', 10, 0, 'uphill', 3);

// Pitch B — building (small), started today.
const bDates = derive(today, 'small');
const b = insertPitch.run({
	title: 'Recordatorios de factura',
	problem: 'Las facturas vencidas se cobran tarde porque nadie da seguimiento manual.',
	appetite: 'small',
	solution_sketch: 'Un job que envía un correo de recordatorio a los N días del vencimiento.',
	data_model: '## Modelo de datos\n- **Invoice** 1:N **Reminder**',
	status: 'building',
	project_id: projectId,
	build_start_date: today,
	build_end_date: bDates.buildEnd,
	cooldown_end_date: bDates.cooldownEnd
}).lastInsertRowid;
insertNogo.run(b, 'Sin recordatorios por SMS');
insertScope.run(b, 'Plantilla de correo', 50, 1, 'uphill', 0);
insertScope.run(b, 'Programador de envíos', 20, 1, 'uphill', 1);

// Pitch C — shaped, not started → betting table (no dates yet).
const c = insertPitch.run({
	title: 'Checklist de onboarding',
	problem: 'Cada alta de proyecto nuevo se hace distinto y se olvidan pasos.',
	appetite: 'big',
	solution_sketch: 'Un checklist por proyecto con pasos predefinidos y estado.',
	data_model: '## Modelo de datos\n- **Project** 1:N **OnboardingStep**',
	status: 'shaped',
	project_id: projectId,
	build_start_date: null,
	build_end_date: null,
	cooldown_end_date: null
}).lastInsertRowid;
insertNogo.run(c, 'Sin gamificación / puntos');

console.log(`Seeded demo: project #${projectId}, pitches #${a} (building), #${b} (building), #${c} (shaped).`);
db.close();
