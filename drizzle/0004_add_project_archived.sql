-- Soft-delete flag on projects. Additive column, no table recreate.
ALTER TABLE `projects` ADD COLUMN `archived` integer DEFAULT 0 NOT NULL;
