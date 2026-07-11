-- Rename the domain entity Client → Project (label change; same shape). Safe
-- ALTER RENAMEs: no table recreate, no data movement, no cascade. Modern SQLite
-- updates the FK reference in `pitches` automatically when the table is renamed.
ALTER TABLE `clients` RENAME TO `projects`;
--> statement-breakpoint
ALTER TABLE `pitches` RENAME COLUMN `client_id` TO `project_id`;
