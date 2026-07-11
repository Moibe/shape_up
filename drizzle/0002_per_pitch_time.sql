-- Per-pitch time model: drop the shared `cycles` table and move the clock onto
-- the pitch (build_start/build_end/cooldown_end). Also rename status 'bet' →
-- 'building' at the constraint level. Existing 'bet' rows were pre-migrated to
-- 'shaped' before this runs, then restored to 'building' with dates afterwards.
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_pitches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`problem` text NOT NULL,
	`appetite` text NOT NULL,
	`solution_sketch` text,
	`data_model` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`client_id` integer,
	`build_start_date` text,
	`build_end_date` text,
	`cooldown_end_date` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "pitches_appetite_ck" CHECK("appetite" IN ('small','big')),
	CONSTRAINT "pitches_status_ck" CHECK("status" IN ('draft','shaped','building','done','rejected'))
);
--> statement-breakpoint
INSERT INTO `__new_pitches`(`id`, `title`, `problem`, `appetite`, `solution_sketch`, `data_model`, `status`, `client_id`, `created_at`)
	SELECT `id`, `title`, `problem`, `appetite`, `solution_sketch`, `data_model`, `status`, `client_id`, `created_at` FROM `pitches`;
--> statement-breakpoint
DROP TABLE `pitches`;
--> statement-breakpoint
ALTER TABLE `__new_pitches` RENAME TO `pitches`;
--> statement-breakpoint
DROP TABLE `cycles`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
