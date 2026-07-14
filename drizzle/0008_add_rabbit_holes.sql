-- Rabbit holes (risks identified during shaping). New table, mirrors nogos.
CREATE TABLE `rabbit_holes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pitch_id` integer NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`pitch_id`) REFERENCES `pitches`(`id`) ON UPDATE no action ON DELETE cascade
);
