-- Admin flag on users. Additive column, no table recreate.
ALTER TABLE `users` ADD COLUMN `is_admin` integer DEFAULT 0 NOT NULL;
