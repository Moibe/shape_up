CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `cycles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`build_end_date` text NOT NULL,
	`cooldown_end_date` text NOT NULL,
	`status` text DEFAULT 'building' NOT NULL,
	CONSTRAINT "cycles_status_ck" CHECK("cycles"."status" IN ('building','cooldown','done'))
);
--> statement-breakpoint
CREATE TABLE `nogos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pitch_id` integer NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`pitch_id`) REFERENCES `pitches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pitches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`problem` text NOT NULL,
	`appetite` text NOT NULL,
	`solution_sketch` text,
	`data_model` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`client_id` integer,
	`cycle_id` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cycle_id`) REFERENCES `cycles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "pitches_appetite_ck" CHECK("pitches"."appetite" IN ('small','big')),
	CONSTRAINT "pitches_status_ck" CHECK("pitches"."status" IN ('draft','shaped','bet','done','rejected'))
);
--> statement-breakpoint
CREATE TABLE `scopes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pitch_id` integer NOT NULL,
	`name` text NOT NULL,
	`hill_position` integer DEFAULT 0 NOT NULL,
	`is_core` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'uphill' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`pitch_id`) REFERENCES `pitches`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "scopes_hill_ck" CHECK("scopes"."hill_position" BETWEEN 0 AND 100),
	CONSTRAINT "scopes_status_ck" CHECK("scopes"."status" IN ('uphill','downhill','done','cut'))
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scope_id` integer NOT NULL,
	`text` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`scope_id`) REFERENCES `scopes`(`id`) ON UPDATE no action ON DELETE cascade
);
